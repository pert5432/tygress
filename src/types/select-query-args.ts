import { ComparisonSqlBuilder, SelectTargetSqlBuilder } from "../sql-builders";
import { AnEntity } from "./entity";
import { JoinArg } from "./query/join-arg";
import { SelectQueryOrder } from "./select-query-order";

export type SelectQueryArgs = {
  joins: JoinArg<AnEntity>[];

  selects?: SelectTargetSqlBuilder[];

  wheres?: ComparisonSqlBuilder[];

  orderBys?: SelectQueryOrder[];

  limit?: number;

  offset?: number;
};
