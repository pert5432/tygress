import { ColumnMetadata, TableMetadata } from "../metadata";
import { ParamBuilder } from "../sql-builders";

export type InsertArgs = {
  entity: TableMetadata;

  columns: ColumnMetadata[];

  values: Object[];

  paramBuilder: ParamBuilder;
};
