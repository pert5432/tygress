import { Joins } from "./join-args";
import { Wheres } from "./where-args";

export type SelectOptions<E> = {
  where?: Wheres<E>;

  joins?: Joins<E>;
};
