import { WhereComparator } from ".";
import { Entity } from "./entity";

export class ParametrizedCondition<V> {
  readonly "@instanceof" = Symbol.for("ParametrizedCondition");

  parameters: V[];
  comparator: WhereComparator;
}

export class ParametrizedConditionWrapper<V> {
  logicalOperator: "AND" | "OR";

  conditions: ParametrizedCondition<V>[];
}

export type Where<Property> = Property extends Array<infer I>
  ? Wheres<I>
  : Property extends Entity<unknown>
  ? Wheres<Property>
  : Property extends number | string | boolean
  ?
      | ParametrizedCondition<Property>
      | ParametrizedConditionWrapper<Property>
      | Property
  : never;

export type Wheres<E extends InstanceType<Entity<unknown>>> = {
  [K in keyof E]?: Where<E[K]>;
};
