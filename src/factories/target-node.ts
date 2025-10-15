import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { TargetNode } from "../types/query";
import { PathMap } from "../utils";

export abstract class TargetNodeFactory {
  public static create<T extends AnEntity>(
    alias: string,
    parentNode: TargetNode,
    klass: T,
    fieldName: string,
    select?: boolean
  ): TargetNode {
    const e = this.common(klass, alias, select);

    e.idKeys = [
      ...parentNode.idKeys,
      `${alias}.${METADATA_STORE.getTablePrimaryKey(klass).fieldName}`,
    ];

    e.parentField = fieldName;

    // Figure out if parent field is an array
    const parentTableMeta = METADATA_STORE.getTable(parentNode.klass);
    if (parentTableMeta.arrayFields.has(e.parentField)) {
      e.parentFieldIsArray = true;
    }
    e.entityByIdPath = new PathMap<InstanceType<AnEntity>>(e.idKeys.length);

    return e;
  }

  public static createRoot<T extends AnEntity>(
    klass: T,
    alias: string,
    select?: boolean
  ): TargetNode {
    const e = this.common(klass, alias, select);

    e.idKeys = [
      `${alias}.${METADATA_STORE.getTablePrimaryKey(klass).fieldName}`,
    ];

    e.entityByIdPath = new PathMap<InstanceType<AnEntity>>(e.idKeys.length);

    return e;
  }

  public static createCTE(alias: string): TargetNode {
    return new TargetNode(Object, alias);
  }

  private static common(
    klass: AnEntity,
    alias: string,
    select?: boolean
  ): TargetNode {
    const e = new TargetNode(klass, alias);

    e.primaryKeyColumn = METADATA_STORE.getTablePrimaryKey(klass);
    e.select = select === false ? false : true;

    return e;
  }
}
