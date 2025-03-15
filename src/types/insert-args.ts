import { ColumnMetadata, TableMetadata } from "../metadata";
import { ParamBuilder } from "../sql-builders";

export type InsertArgs = {
  paramBuilder: ParamBuilder;

  entity: TableMetadata;
  columns: ColumnMetadata[];
  values: Object[];

  returning: ColumnMetadata[];
};
