import { ComparisonSqlBuilder, SelectTargetSqlBuilder } from "../sql-builders";
import { AnEntity } from "./entity";
import { JoinArg } from "./query/join-arg";
import { SelectQueryOrder } from "./select-query-order";

export type SelectQueryArgs = {
  selects: SelectTargetSqlBuilder[];

  joins: JoinArg<AnEntity>[];

  wheres: ComparisonSqlBuilder[];

  orderBys: SelectQueryOrder[];

  limit?: number;

  offset?: number;
};
