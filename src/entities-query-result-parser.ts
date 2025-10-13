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

    // Path thru the tree of TargetNodes
    const path = this.buildTargetNodePath(joinNodes);

    const result: InstanceType<T>[] = [];

    // Go thru all rows, creating entities and grouping them by relations
    for (const row of rows) {
      // Collect ids for all nodes in the path by accessing the row only once
      const ids: PathKey[] = [];
      // Think of this array as one iteration behind ids
      const parentIds: PathKey[] = [];

      for (let j = 0; j < path.length; j += 1, parentIds.push(ids.at(-1)!)) {
        const node = path[j]!;

        ids.push(row[node.idKeys.at(-1)!]);

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

  // returns an array with elements of TargetNode tree as output from a pre-order traversal
  private static buildTargetNodePath(rootNode: TargetNode): TargetNode[] {
    let path: TargetNode[] = [];

    const buildPath = (node: TargetNode): void => {
      path.push(node);

      for (const childNode of Object.values(node.joins)) {
        buildPath(childNode);
      }
    };

    buildPath(rootNode);

    return path;
  }
}
