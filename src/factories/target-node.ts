import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata";
import { AnEntity, Entity } from "../types";
import { TargetNode } from "../types/query";

export abstract class TargetNodeFactory {
  public static create<T extends Entity<unknown>>(
    alias: string,
    parentNode: TargetNode<AnEntity>,
    klass: T,
    fieldName: string,
    select?: boolean
  ): TargetNode<T> {
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new TargetNode(klass, alias);

    e.parentField = fieldName;

    e.idKeys = [...parentNode.idKeys, `${alias}.${primaryKey.fieldName}`];

    // Always select primary key
    e.primaryKeyColumn = METADATA_STORE.getColumn(klass, primaryKey.fieldName);

    e.select = select === false ? false : true;

    // Figure out if parent field is an array
    const parentTableMeta = METADATA_STORE.getTable(parentNode.klass);
    if (parentTableMeta.arrayFields.has(e.parentField)) {
      e.parentFieldIsArray = true;
    }

    return e;
  }

  public static createRoot<T extends AnEntity>(
    klass: T,
    alias: string,
    select?: boolean
  ): TargetNode<T> {
    const primaryKey = METADATA_STORE.getTablePrimaryKey(klass);

    const e = new TargetNode(klass, alias);

    e.idKeys = [`${alias}.${primaryKey.fieldName}`];

    e.primaryKeyColumn = METADATA_STORE.getColumn(klass, primaryKey.fieldName);

    e.select = select === false ? false : true;

    return e;
  }
}
