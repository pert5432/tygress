import { ColumnMetadata } from "../metadata";
import { TableMetadata } from "../metadata/table-metadata";
import { UniqueConstraintMetadata } from "../metadata/unique-constraint";
import { AnEntity } from "../types";
import { TableMetadataArgs } from "../types/create-args";

export abstract class TableMetadataFactory {
  public static create(
    { tablename, klass, schemaname }: TableMetadataArgs,
    columns: ColumnMetadata[],
    uniqueConstraint: UniqueConstraintMetadata<AnEntity>
  ): TableMetadata {
    const e = new TableMetadata();

    e.tablename = tablename;
    e.klass = klass;
    e.schemaname = schemaname;

    // Set columns
    e.columns = columns;
    for (const column of columns) {
      // Add column to map on table
      e.columnsMap.set(column.fieldName, column);

      // Add table metadata to column
      column.table = e;
    }

    e.primaryKey = uniqueConstraint;

    e.indexes = [];

    return e;
  }
}
