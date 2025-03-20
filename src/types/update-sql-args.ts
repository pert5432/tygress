import { ColumnMetadata, TableMetadata } from "../metadata";
import { JoinNode } from "../repository";
import { ComparisonSqlBuilder, ParamBuilder } from "../sql-builders";

export type UpdateSqlArgs = {
  paramBuilder: ParamBuilder;

  entity: JoinNode;

  values: { column: ColumnMetadata; value: any }[];

  wheres: ComparisonSqlBuilder[];

  returning: ColumnMetadata[];
};
