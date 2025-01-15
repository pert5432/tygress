import { Client } from "pg";
import { AnEntity, Entity } from "./types";
import { TargetNode, Query } from "./types/query";

export class QueryRunner<T extends Entity<unknown>> {
  private sql: string;
  private params: any[];
  private joinNodes: TargetNode<T>;

  constructor(private client: Client, query: Query<T>) {
    this.sql = query.sql;
    this.params = query.params;
    this.joinNodes = query.joinNodes;

    console.log(this.sql);
    console.log(this.params);
  }

  public async run(): Promise<InstanceType<T>[]> {
    const { rows } = await this.client.query(this.sql, this.params);

    let paths: TargetNode<Entity<unknown>>[][] = [];

    const buildPath = (parent: TargetNode<Entity<unknown>>[]): void => {
      let node: TargetNode<Entity<unknown>> = parent[parent.length - 1];

      const keys = Object.keys(node.joins);

      if (!keys.length) {
        return;
      }

      // Build new paths from first n-1 keys
      for (let i = 0; i < keys.length - 1; i += 1) {
        const newPath = [...parent, node.joins[keys[i]]!];
        paths.push(newPath);

        buildPath(newPath);
      }

      // Extend this path using the last join in this node
      parent.push(node.joins[keys[keys.length - 1]]!);
      return buildPath(parent);
    };

    const path = [this.joinNodes];
    paths.push(path);

    buildPath(path);

    // Reverse paths so we can go from leaves up with a simple for ... of loop
    paths = paths.map((e) => e.reverse());

    // This just might not be needed, idk, refactor later
    const rootEntities = new Map<string, InstanceType<Entity<unknown>>>();

    // Go thru all rows, creating entities and grouping them by relations
    for (const row of rows) {
      for (const path of paths) {
        for (const node of path) {
          const ids = node.idKeys.map((key) => row[key]);
          const fullIdPath = ids.join("-");

          // Stop processing this path if the exact entity exists in the path already
          if (node.entityByIdPath.has(fullIdPath)) {
            break;
          }

          // Construct entity
          const e = new node.klass() as Entity<any>;
          for (const [field, { fullName }] of node.selectedFields) {
            e[field] = row[fullName];
          }

          // Is root entity
          if (ids.length === 1) {
            rootEntities.set(ids[0].toString(), e as T);

            continue;
          }

          // Register entity by unique path
          node.entityByIdPath.set(fullIdPath, e);

          // Add entity to array for a parent entity
          const parentsIdPath = ids.slice(0, -1).join("-");
          const entitiesByParents =
            node.entitiesByParentsIdPath.get(parentsIdPath);

          if (entitiesByParents) {
            entitiesByParents.push(e);
          } else {
            node.entitiesByParentsIdPath.set(parentsIdPath, [e]);
          }
        }
      }
    }

    //
    // Propagate entity instances up tree of join nodes
    //
    for (const path of paths) {
      // Propagate entities up to second to last node in path
      // After this all nodes in the path except the root will have their joined entities filled
      for (let i = 0; i < path.length - 2; i += 1) {
        const node = path[i];
        const parentNode = path[i + 1];

        this.propagateEntitiesToParent(parentNode.entityByIdPath, node);
      }

      // Propagate entities to root node
      const penultimateNode = path[path.length - 2];
      this.propagateEntitiesToParent(rootEntities, penultimateNode);
    }

    return Array.from(rootEntities.values()) as InstanceType<T>[];
  }

  // Util to propagate entity instances into relation fields on its parent
  private propagateEntitiesToParent = <P extends AnEntity, C extends AnEntity>(
    parentEntityMap: Map<string, InstanceType<P>>,
    node: TargetNode<C>
  ) => {
    for (const [key, entities] of node.entitiesByParentsIdPath.entries()) {
      const parentEntity: any = parentEntityMap.get(key)!;

      // Push values to parent as an array if parent field is array
      parentEntity[node.parentField!] =
        Reflect.getMetadata("design:type", parentEntity, node.parentField!) ===
        Array
          ? entities
          : entities[0];
    }
  };
}
