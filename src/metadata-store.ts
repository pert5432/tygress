import { ColumnMetadata } from "./column-metadata";
import { TableMetadata } from "./table-metadata";
import { Entity } from "./types/entity";

class MetadataStore {
  public tables = new Map<Entity<unknown>, TableMetadata>();
  public columns = new Map<Entity<unknown>, ColumnMetadata[]>();

  public addTable(table: Entity<unknown>, metadata: TableMetadata): void {
    if (this.tables.get(table)) {
      throw new Error(`Metadata for table ${table} already registered`);
    }

    // Add existing columns to this tables metadata
    const columns = this.columns.get(table) ?? [];
    metadata.columns = columns;

    for (const column of columns) {
      metadata.columnsMap.set(column.fieldName, column);
    }

    this.tables.set(table, metadata);
  }

  public addColumn(table: Entity<unknown>, column: ColumnMetadata): void {
    const newColumns = this.columns.get(table) ?? [];
    newColumns.push(column);

    this.columns.set(table, newColumns);
  }

  public getTable<T>(table: T): TableMetadata {
    const res = this.tables.get(table as Entity<unknown>);
    if (!res) {
      throw new Error(`No metadata found for ${table}`);
    }

    return res;
  }
}

export const METADATA_STORE = new MetadataStore();
