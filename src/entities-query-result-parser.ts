import { AnEntity } from "./types";
import { TargetNode } from "./types/query";

export abstract class QueryResultEntitiesParser {
  public static async parse<T extends AnEntity>(
    rows: any[],
    joinNodes: TargetNode
  ): Promise<InstanceType<T>[]> {
    // Don't bother doing anything when we know we won't return anything
    if (!rows.length) {
      return [];
    }

    // Build join node paths to map entity results to
    const paths = this.buildJoinNodePaths(joinNodes);

    // Go thru all rows, creating entities and grouping them by relations
    for (const row of rows) {
      for (let i = 0; i < paths.length; i += 1) {
        const path = paths[i]!;

        // Collect ids for all nodes in the path by accessing the row only once
        const ids = path[0]!.idKeys.map((key) => row[key]);

        // Skip processing last node in path if this is not the first path
        // Reason for this is that the node is the root node and it got fully processed in the first path already
        for (let j = 0; j < path.length - (i > 1 ? 1 : 0); j += 1, ids.pop()) {
          const node = path[j]!;

          // Id of this node is null in this row so we can't return it as an entity
          if (ids.at(-1) === null) {
            continue;
          }

          // Stop processing this path if the exact entity exists in the path already
          // Since we have seen this exact chain of ids already we have seen all the upcoming entities in the rest of this path
          if (node.entityByIdPath.has(ids)) {
            break;
          }

          // Register entity by unique path
          node.entityByIdPath.set(ids, true);

          const e = this.constructEntity(row, node);

          node.entities.push({ idPath: [...ids], entity: e });
        }
      }
    }

    // Collect entities in maps for parent
    for (const path of paths) {
      for (let j = 0; j < path.length - 1; j += 1) {
        const node = path[j]!;

        for (const { idPath, entity } of node.entities) {
          const parentsIdPath = idPath.slice(0, -1);

          const parentsArray = node.entitiesByParentsIdPath.get(parentsIdPath);

          if (parentsArray) {
            (parentsArray as AnEntity[]).push(entity);
          } else {
            node.entitiesByParentsIdPath.set(parentsIdPath, [entity]);
          }
        }
      }
    }

    //
    // Propagate entity instances up tree of join nodes
    //
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const childNode = path[i]!;
        const parentNode = path[i + 1]!;

        this.propagateEntitiesToParent(parentNode, childNode);
      }
    }

    // All of the paths contain the parent node, we just pick the first one
    const path = paths[0]!;

    // Return the entities from the last node in the path, these are the root entities
    return path[path.length - 1]!.entities.map(
      (e) => e.entity
    ) as InstanceType<T>;
  }

  private static constructEntity(
    row: any,
    node: TargetNode
  ): InstanceType<AnEntity> {
    const e = new node.klass();
    for (const { fieldName, selectTarget } of node.selectedFields) {
      e[fieldName] = row[selectTarget];
    }

    return e;
  }

  // Util to propagate entity instances into relation fields on its parent
  private static propagateEntitiesToParent(
    parentNode: TargetNode,
    childNode: TargetNode
  ) {
    for (const {
      idPath: parentsIdPath,
      entity: parentEntity,
    } of parentNode.entities) {
      const childEntities = (childNode.entitiesByParentsIdPath.get(
        parentsIdPath
      ) ?? []) as AnEntity[];

      parentEntity[childNode.parentField!] = childNode.parentFieldIsArray
        ? childEntities
        : childEntities[0];
    }
  }

  private static buildJoinNodePaths(joinNodes: TargetNode): TargetNode[][] {
    let paths: TargetNode[][] = [[joinNodes]];

    const buildPath = (parent: TargetNode[]): void => {
      let node: TargetNode = parent[parent.length - 1]!;

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

    buildPath(paths[0]!);

    // Reverse paths so we can go from leaves up with a simple for ... of loop
    return paths.map((e) => e.reverse());
  }
}
