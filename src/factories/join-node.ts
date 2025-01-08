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

    const e = new JoinNode(klass, alias);

    e.parentField = fieldName;
    e.relationToParent = this.getRelationToParent(relation);

    e.idKeys = [...previousNode.idKeys, `${alias}.id`];

    e.path = [...previousNode.path, fieldName];

    return e;
  }

  public static createRoot<T extends Entity<unknown>>(klass: T): JoinNode<T> {
    const alias = entityNameToAlias(klass.name);

    const e = new JoinNode(klass, alias);

    e.idKeys = [`${alias}.id`];

    return e;
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
