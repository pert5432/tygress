import { ColumnMetadata } from "../../metadata";
import { JoinNode } from "../../repository";
import { ComparisonSqlBuilder, ConstantBuilder } from "../../sql-builders";

export type DeleteSqlArgs = {
  constBuilder: ConstantBuilder;

  entity: JoinNode;

  wheres: ComparisonSqlBuilder[];

  returning: ColumnMetadata[];
};
