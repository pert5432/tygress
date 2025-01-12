import { AnEntity } from "./entity";
import { OrderArgs } from "./order-args";
import { JoinArg } from "./query/join-arg";
import { SelectTargetArgs } from "./select-target-args";
import { Wheres } from "./where-args";

export type SelectQueryArgs<E extends AnEntity> = {
  select?: SelectTargetArgs<InstanceType<E>>;

  joins: JoinArg<AnEntity>[];

  where?: Wheres<InstanceType<E>>;

  order?: OrderArgs<InstanceType<E>>;

  limit?: number;

  offset?: number;
};
