import { ComparisonSqlBuilder } from "../sql-builders";
import { AnEntity } from "./entity";
import { OrderArgs } from "./order-args";
import { JoinArg } from "./query/join-arg";
import { SelectTargetArgs } from "./select-target-args";

export type SelectQueryArgs<E extends AnEntity> = {
  select?: SelectTargetArgs<InstanceType<E>>;

  joins: JoinArg<AnEntity>[];

  wheres: ComparisonSqlBuilder[];

  order?: OrderArgs<InstanceType<E>>;

  limit?: number;

  offset?: number;
};
