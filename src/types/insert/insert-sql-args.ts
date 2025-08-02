import { ColumnMetadata, TableMetadata } from "../../metadata";
import { ConstantBuilder } from "../../sql-builders";

export type InsertSqlArgs = {
  constBuilder: ConstantBuilder;

  entity: TableMetadata;
  columns: ColumnMetadata[];
  values: Object[];

  returning: ColumnMetadata[];

  onConflict?: "DO NOTHING" | "DO UPDATE";
  conflictColumns: ColumnMetadata[];
  updateColumns: ColumnMetadata[];
};
