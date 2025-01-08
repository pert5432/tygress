import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata";
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
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new JoinNode(klass, alias);

    e.parentField = fieldName;
    e.relationToParent = this.getRelationToParent(relation);

    e.idKeys = [...previousNode.idKeys, `${alias}.${primaryKey.fieldName}`];
    e.path = [...previousNode.path, fieldName];

    e.selectField(METADATA_STORE.getColumn(klass, primaryKey.fieldName));

    return e;
  }

  public static createRoot<T extends Entity<unknown>>(klass: T): JoinNode<T> {
    const alias = entityNameToAlias(klass.name);
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new JoinNode(klass, alias);

    e.idKeys = [`${alias}.${primaryKey.fieldName}`];

    e.selectField(METADATA_STORE.getColumn(klass, primaryKey.fieldName));

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
