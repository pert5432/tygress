import { Relation } from "../enums";
import { Entity } from "../types";
import { JoinNode } from "../types/query";
import { entityNameToAlias } from "../utils";

export abstract class JoinNodeFactory {
  public static create<T extends Entity<unknown>>(
    previousNode: JoinNode<Entity<unknown>>,
    klass: T,
    fieldName: string,
    relation: Relation
  ): JoinNode<T> {
    const alias = `${previousNode.alias}_${entityNameToAlias(klass.name)}`;

    return {
      klass,
      alias,

      parentField: fieldName,
      relationToParent: this.getRelationToParent(relation),

      idKeys: [...previousNode.idKeys, `${alias}.id`],

      path: [...previousNode.path, fieldName],
      joins: {},

      ...this.defaults(),
    };
  }

  public static createRoot<T extends Entity<unknown>>(klass: T): JoinNode<T> {
    const alias = entityNameToAlias(klass.name);

    return {
      klass,
      alias,

      idKeys: [`${alias}.id`],

      path: [],
      joins: {},

      ...this.defaults(),
    };
  }

  private static defaults<T extends Entity<unknown>>(): Pick<
    JoinNode<T>,
    "selectedFields" | "entitiesByParentsIdPath" | "entityByIdPath"
  > {
    return {
      selectedFields: new Map(),
      entitiesByParentsIdPath: new Map(),
      entityByIdPath: new Map(),
    };
  }

  private static getRelationToParent(relation: Relation): Relation {
    switch (relation) {
      case Relation.ONE_TO_MANY:
        return Relation.MANY_TO_ONE;
      case Relation.MANY_TO_ONE:
        return Relation.ONE_TO_MANY;
      default:
        return Relation.ONE_TO_ONE;
    }
  }
}
