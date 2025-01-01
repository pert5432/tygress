import { ColumnMetadata } from "../column-metadata";
import { ColumnMetadataArgs } from "../types/args";

export abstract class ColumnMetadataFactory {
  public static create({
    name,
    fieldName,
  }: ColumnMetadataArgs): ColumnMetadata {
    const e = new ColumnMetadata();

    e.name = name;
    e.fieldName = fieldName;

    return e;
  }
}
