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

    // Build join node paths to map entity results to
    const paths = this.buildJoinNodePaths(joinNodes);

    // Go thru all rows, creating entities and grouping them by relations
    for (const row of rows) {
      for (let i = 0; i < paths.length; i += 1) {
        const path = paths[i]!;

        // Skip processing last node in path if this is not the first path
        // Reason for this is that the node is the root node and it got fully processed in the first path already
        for (let j = 0; j < path.length - (i < 1 ? 0 : 1); j += 1) {
          const node = path[j]!;

          const ids = node.idKeys.map((key) => row[key]);
          const fullIdPath = ids.join("-");

          // Stop processing this path if the exact entity exists in the path already
          // Since we have seen this exact chain of ids already we have seen all the upcoming entities in the rest of this path
          if (node.entityByIdPath.has(fullIdPath)) {
            break;
          }

          // Id of this node is null in this row
          if (ids[ids.length - 1] === null) {
            continue;
          }

          const e = this.constructEntity(row, node);

          // Register entity by unique path
          node.entityByIdPath.set(fullIdPath, e);

          // We reached the root entity in the path so there are no parent entities to push this entity to
          if (ids.length === 1) {
            continue;
          }

          const parentsIdPath = ids.slice(0, -1).join("-");

          const parentsArray = node.entitiesByParentsIdPath.get(parentsIdPath);

          if (parentsArray) {
            parentsArray.push(e);
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
      for (let i = 0; i < path.length - 1; i += 1) {
        const node = path[i]!;
        const parentNode = path[i + 1]!;

        this.propagateEntitiesToParent(parentNode.entityByIdPath, node);
      }
    }

    // All of the paths contain the parent node, we just pick the first one
    const path = paths[0]!;

    const res = Array.from(
      path[path.length - 1]!.entityByIdPath.values()
    ) as InstanceType<T>;

    // Return the entities from the last node in the path, these are the root entities
    return res;
  }

  private static constructEntity(
    row: any,
    node: TargetNode<AnEntity>
  ): InstanceType<AnEntity> {
    const e = new node.klass();
    for (const { fieldName, selectTarget } of node.selectedFields) {
      e[fieldName] = row[selectTarget];
    }

    return e;
  }

  // Util to propagate entity instances into relation fields on its parent
  private static propagateEntitiesToParent<
    P extends AnEntity,
    C extends AnEntity
  >(parentEntityMap: Map<string, InstanceType<P>>, childNode: TargetNode<C>) {
    for (const [parentEntityId, parentEntity] of parentEntityMap.entries()) {
      const childEntities =
        childNode.entitiesByParentsIdPath.get(parentEntityId) ?? [];

      parentEntity[childNode.parentField!] = childNode.parentFieldIsArray
        ? childEntities
        : childEntities[0];
    }
  }

  private static buildJoinNodePaths(
    joinNodes: TargetNode<AnEntity>
  ): TargetNode<AnEntity>[][] {
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
    return paths.map((e) => e.reverse());
  }
}
