import { Entity } from "./entity";

export type WhereComparator = "gt" | "gte" | "lt" | "lte" | "eq" | "not-eq";

export class WhereCondition<V> {
  readonly "@instanceof" = Symbol.for("WhereCondition");

  value: V;
  condition: WhereComparator;
}

export type Where<Property> = Property extends Array<infer I>
  ? Wheres<I>
  : Property extends Entity<unknown>
  ? Wheres<Property>
  : Property extends number | string | boolean
  ? WhereCondition<Property>
  : never;

export type Wheres<E extends InstanceType<Entity<unknown>>> = {
  [K in keyof E]?: Where<E[K]>;
};
