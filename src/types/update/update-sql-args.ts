import { ColumnMetadata } from "../../metadata";
import { JoinNode } from "../../repository";
import { ComparisonSqlBuilder, ConstantBuilder } from "../../sql-builders";

export type UpdateSqlArgs = {
  constBuilder: ConstantBuilder;

  entity: JoinNode;

  values: { column: ColumnMetadata; value: any }[];

  wheres: ComparisonSqlBuilder[];

  returning: ColumnMetadata[];
};
