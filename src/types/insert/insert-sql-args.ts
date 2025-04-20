import { ColumnMetadata, TableMetadata } from "../../metadata";
import { ParamBuilder } from "../../sql-builders";

export type InsertSqlArgs = {
  paramBuilder: ParamBuilder;

  entity: TableMetadata;
  columns: ColumnMetadata[];
  values: Object[];

  returning: ColumnMetadata[];

  onConflict?: "DO NOTHING" | "DO UPDATE";
  conflictColumns: ColumnMetadata[];
  updateColumns: ColumnMetadata[];
};
