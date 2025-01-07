import { TableMetadata } from "../metadata/table-metadata";
import { TableMetadataArgs } from "../types/create-args";

export abstract class TableMetadataFactory {
  public static create({
    tablename,
    klass,
    schemaname,
  }: TableMetadataArgs): TableMetadata {
    const e = new TableMetadata();

    e.tablename = tablename;
    e.klass = klass;
    e.schemaname = schemaname;

    return e;
  }
}
