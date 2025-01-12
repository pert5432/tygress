import { ComparisonSqlBuilder } from "../sql-builders";
import { AnEntity } from "./entity";
import { OrderArgs } from "./order-args";
import { JoinArg } from "./query/join-arg";
import { SelectQueryTarget } from "./select-query-target";

export type SelectQueryArgs<E extends AnEntity> = {
  selects: SelectQueryTarget[];

  joins: JoinArg<AnEntity>[];

  wheres: ComparisonSqlBuilder[];

  order?: OrderArgs<InstanceType<E>>;

  limit?: number;

  offset?: number;
};
