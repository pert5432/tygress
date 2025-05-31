import { ColumnMetadata } from "../metadata/column-metadata";
import { ColumnMetadataArgs } from "../types/create-args";
import { isNull } from "../utils";

export abstract class ColumnMetadataFactory {
  public static create({
    name,
    fieldName,
    select,

    dataType,
    nullable,
    default: defaultValue,
    primaryKey,
  }: ColumnMetadataArgs): ColumnMetadata {
    const e = new ColumnMetadata();

    e.name = name;
    e.fieldName = fieldName;

    e.select = isNull(select) ? true : select!;

    e.dataType = dataType;
    e.nullable = nullable ?? false;
    e.default = defaultValue;
    e.primaryKey = primaryKey ?? false;

    return e;
  }
}
