import { ColumnMetadata } from "../metadata/column-metadata";
import { ColumnMetadataArgs } from "../types/args";
import { isNull } from "../utils";

export abstract class ColumnMetadataFactory {
  public static create({
    name,
    fieldName,
    select,
  }: ColumnMetadataArgs): ColumnMetadata {
    const e = new ColumnMetadata();

    e.name = name;
    e.fieldName = fieldName;

    e.select = isNull(select) ? true : select!;

    return e;
  }
}
