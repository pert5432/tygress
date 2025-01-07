import { Entity } from "./entity";
import { Joins } from "./join-args";
import { OrderArgs } from "./order-args";
import { Wheres } from "./where-args";

export type SelectArgs<E extends InstanceType<Entity<unknown>>> = {
  where?: Wheres<E>;

  joins?: Joins<E>;

  order?: OrderArgs<E>;

  limit?: number;

  offset?: number;
};
