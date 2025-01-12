import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata";
import { AnEntity, Entity } from "../types";
import { TargetNode } from "../types/query";

export abstract class TargetNodeFactory {
  public static create<T extends Entity<unknown>>(
    alias: string,
    parentNode: TargetNode<AnEntity>,
    klass: T,
    fieldName: string
  ): TargetNode<T> {
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new TargetNode(klass, alias);

    e.parentField = fieldName;

    e.idKeys = [...parentNode.idKeys, `${alias}.${primaryKey.fieldName}`];

    e.selectField(METADATA_STORE.getColumn(klass, primaryKey.fieldName));

    return e;
  }

  public static createRoot<T extends AnEntity>(
    klass: T,
    alias: string
  ): TargetNode<T> {
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new TargetNode(klass, alias);

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
