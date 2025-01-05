import { WhereComparator } from ".";
import { Entity } from "./entity";

export class ParametrizedCondition<V> {
  readonly "@instanceof" = Symbol.for("ParametrizedCondition");

  parameter: V;
  condition: WhereComparator;
}

export type Where<Property> = Property extends Array<infer I>
  ? Wheres<I>
  : Property extends Entity<unknown>
  ? Wheres<Property>
  : Property extends number | string | boolean
  ? ParametrizedCondition<Property> | Property
  : never;

export type Wheres<E extends InstanceType<Entity<unknown>>> = {
  [K in keyof E]?: Where<E[K]>;
};
