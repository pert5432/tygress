import { ComparisonSqlBuilder } from "../sql-builders";
import { AnEntity } from "./entity";
import { OrderArgs } from "./order-args";
import { JoinArg } from "./query/join-arg";
import { SelectQueryOrder } from "./select-query-order";
import { SelectQueryTarget } from "./select-query-target";

export type SelectQueryArgs = {
  selects: SelectQueryTarget[];

  joins: JoinArg<AnEntity>[];

  wheres: ComparisonSqlBuilder[];

  orderBys: SelectQueryOrder[];

  limit?: number;

  offset?: number;
};
