import { Client } from "pg";
import { Entity } from "./types";
import { JoinNode, Query } from "./types/query";
import { Relation } from "./enums";

export class QueryRunner<T extends Entity<unknown>> {
  private sql: string;
  private joinNodes: JoinNode<T>;

  constructor(private client: Client, query: Query<T>) {
    this.sql = query.sql;
    this.joinNodes = query.joinNodes;
  }

  public async run(): Promise<T[]> {
    const { rows } = await this.client.query(this.sql);

    let paths: JoinNode<Entity<unknown>>[][] = [];

    const buildPath = (parent: JoinNode<Entity<unknown>>[]): void => {
      let node: JoinNode<Entity<unknown>> = parent[parent.length - 1];

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

    const rootEntities = new Map<string, Entity<unknown>>();

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

    for (const path of paths) {
      // Process path until root - 2
      for (let i = 0; i < path.length - 2; i += 1) {
        const node = path[i];
        const parentNode = path[i + 1];

        // Register entities to its parent entity
        for (const [key, entities] of node.entitiesByParentsIdPath.entries()) {
          const parentEntity = parentNode.entityByIdPath.get(key)!;

          parentEntity[node.parentField!] =
            node.relationToParent === Relation.MANY_TO_ONE
              ? entities
              : entities[0];
        }
      }
    }

    for (const path of paths) {
      // Second to last node of the path
      const penultimateNode = path[path.length - 2];

      // Register entities to root entities
      for (const [
        key,
        entities,
      ] of penultimateNode.entitiesByParentsIdPath.entries()) {
        const parentEntity = rootEntities.get(key)!;

        parentEntity[penultimateNode.parentField!] =
          penultimateNode.relationToParent === Relation.MANY_TO_ONE
            ? entities
            : entities[0];
      }
    }

    return Array.from(rootEntities.values()) as T[];
  }
}
