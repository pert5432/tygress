import { AnEntity } from "./types";
import { TargetNode } from "./types/query";

export abstract class QueryResultEntitiesParser {
  public static async parse<T extends AnEntity>(
    rows: any[],
    joinNodes: TargetNode<AnEntity>
  ): Promise<InstanceType<T>[]> {
    // Don't bother doing anything when we know we won't return anything
    if (!rows.length) {
      return [];
    }

    let paths: TargetNode<AnEntity>[][] = [];

    const buildPath = (parent: TargetNode<AnEntity>[]): void => {
      let node: TargetNode<AnEntity> = parent[parent.length - 1]!;

      const keys = Object.keys(node.joins);

      if (!keys.length) {
        return;
      }

      // Build new paths from first n-1 keys
      for (let i = 0; i < keys.length - 1; i += 1) {
        const newPath = [...parent, node.joins[keys[i]!]!];
        paths.push(newPath);

        buildPath(newPath);
      }

      // Extend this path using the last join in this node
      parent.push(node.joins[keys[keys.length - 1]!]!);
      return buildPath(parent);
    };

    const path = [joinNodes];
    paths.push(path);

    buildPath(path);

    // Reverse paths so we can go from leaves up with a simple for ... of loop
    paths = paths.map((e) => e.reverse());

    // This just might not be needed, idk, refactor later
    const rootEntities = new Map<string, InstanceType<AnEntity>>();

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
          const e = new node.klass() as AnEntity;
          for (const { fieldName, selectTarget } of node.selectedFields) {
            e[fieldName] = row[selectTarget];
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
        const node = path[i]!;
        const parentNode = path[i + 1]!;

        this.propagateEntitiesToParent(parentNode.entityByIdPath, node);
      }

      if (path.length >= 2) {
        // Propagate entities to root node
        const penultimateNode = path[path.length - 2]!;
        this.propagateEntitiesToParent(rootEntities, penultimateNode);
      }
    }

    return Array.from(rootEntities.values()) as InstanceType<T>[];
  }

  // Util to propagate entity instances into relation fields on its parent
  private static propagateEntitiesToParent = <
    P extends AnEntity,
    C extends AnEntity
  >(
    parentEntityMap: Map<string, InstanceType<P>>,
    node: TargetNode<C>
  ) => {
    for (const [key, entities] of node.entitiesByParentsIdPath.entries()) {
      const parentEntity: any = parentEntityMap.get(key)!;

      // Push values to parent as an array if parent field is array
      parentEntity[node.parentField!] = node.parentFieldIsArray
        ? entities
        : entities[0];
    }
  };
}
