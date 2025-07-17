import { AnEntity } from "./entity";
import { Joins } from "./join-args";
import { OrderArgs } from "./order-args";
import { SelectTargetArgs } from "./select-target-args";
import { Wheres } from "./where-args";

export type SelectArgs<E extends InstanceType<AnEntity>> = {
  select?: SelectTargetArgs<E>;

  joins?: Joins<E>;

  where?: Wheres<E>;

  order?: OrderArgs<E>;

  limit?: number;

  offset?: number;
};
