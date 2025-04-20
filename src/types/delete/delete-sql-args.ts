import { ColumnMetadata } from "../../metadata";
import { JoinNode } from "../../repository";
import { ComparisonSqlBuilder, ParamBuilder } from "../../sql-builders";

export type DeleteSqlArgs = {
  paramBuilder: ParamBuilder;

  entity: JoinNode;

  wheres: ComparisonSqlBuilder[];

  returning: ColumnMetadata[];
};
