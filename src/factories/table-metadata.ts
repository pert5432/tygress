import { ColumnMetadata, RelationMetadata } from "../metadata";
import { TableMetadata } from "../metadata/table-metadata";
import { UniqueConstraintMetadata } from "../metadata/unique-constraint";
import { AnEntity } from "../types";
import { TableMetadataArgs } from "../types/create-args";

export abstract class TableMetadataFactory {
  public static create(
    { tablename, klass, schemaname }: TableMetadataArgs,
    columns: ColumnMetadata[],
    relations: RelationMetadata[],
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

    for (const relation of relations) {
      if (relation.foreign === klass) {
        e.relations.set(relation.foreignField, relation);
      } else if (relation.primary === klass) {
        e.relations.set(relation.primaryField, relation);
      } else {
        throw new Error(
          `Tried to register relation that belongs to ${relation.primary} and ${relation.foreign} to ${klass}`
        );
      }
    }

    e.primaryKey = uniqueConstraint;

    return e;
  }
}
