import { Entity } from "./entity";
import { Joins } from "./join-args";
import { Wheres } from "./where-args";

export type SelectOptions<E extends InstanceType<Entity<unknown>>> = {
  where?: Wheres<E>;

  joins?: Joins<E>;
};
