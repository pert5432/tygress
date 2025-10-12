import { AnEntity } from "./types";
import { TargetNode } from "./types/query";
import { PathKey } from "./utils";

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

    const result: InstanceType<T>[] = [];

    // Go thru all rows, creating entities and grouping them by relations
    for (const row of rows) {
      for (let i = 0; i < paths.length; i += 1) {
        const path = paths[i]!;

        // Collect ids for all nodes in the path by accessing the row only once
        const ids: PathKey[] = [];
        // Think of this array as one iteration behind ids
        const parentIds: PathKey[] = [];

        for (let j = 0; j < path.length; j += 1, parentIds.push(ids.at(-1)!)) {
          const node = path[j]!;

          ids.push(row[node.idKeys.at(-1)!]);

          // Skip processing root node in path if this is not the first path
          // Reason for this is that the root node got fully processed in the first path already
          if (j === 0 && i < 0) {
            continue;
          }

          // Id of this node is null in this row so we can't return it as an entity
          // This means we can't return any of this nodes child relations as entities either so we stop processing this path
          if (ids.at(-1) === null) {
            break;
          }

          // Stop processing this path if the exact entity exists in the path already
          // Since we have seen this exact chain of ids already we have seen all the upcoming entities in the rest of this path
          if (node.entityByIdPath.has(ids)) {
            continue;
          }

          const entity = this.constructEntity(row, node);

          // Register entity by unique path
          node.entityByIdPath.set(ids, entity);

          // Push root entity to result array
          if (j === 0) {
            result.push(entity);
            // Or child entity to parent entity
          } else {
            if (node.parentFieldIsArray) {
              (
                path[j - 1]!.entityByIdPath.get(parentIds)![
                  node.parentField!
                ] as any[]
              ).push(entity);
            } else {
              path[j - 1]!.entityByIdPath.get(parentIds)![node.parentField!] =
                entity;
            }
          }
        }
      }
    }

    return result;
  }

  private static constructEntity(
    row: any,
    node: TargetNode
  ): InstanceType<AnEntity> {
    const e = new node.klass();

    for (const { fieldName, selectTarget } of node.selectedFields) {
      e[fieldName] = row[selectTarget];
    }

    // Initialize all relation fields that are arrays to empty arrays
    for (const [key, childNode] of Object.entries(node.joins)) {
      if (childNode.parentFieldIsArray) {
        e[key] = [];
      }
    }

    return e;
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

    return paths;
  }
}
