import { WhereComparator } from ".";
import { AnEntity, Entity } from "./entity";
import { Parametrizable } from "./parametrizable";

export class ParametrizedCondition<V> {
  readonly "@instanceof" = Symbol.for("ParametrizedCondition");

  parameters: V[];
  comparator: WhereComparator;
}

export class ParametrizedConditionWrapper<V> {
  readonly "@instanceof" = Symbol.for("ParametrizedConditionWrapper");

  logicalOperator: "AND" | "OR";
  conditions: ParametrizedCondition<V>[];
}

export class NotConditionWrapper<V> {
  readonly "@instanceof" = Symbol.for("NotConditionWrapper");

  condition: ParametrizedConditionWrapper<V>;
}

export type ParameterArgs<Property extends Parametrizable> =
  | ParametrizedCondition<Property>
  | ParametrizedConditionWrapper<Property>
  | NotConditionWrapper<Property>;

export type Where<Property> = Property extends Parametrizable
  ? ParameterArgs<Property> | Property
  : Property extends Array<infer I>
  ? Wheres<I>
  : Property extends AnEntity | InstanceType<AnEntity>
  ? Wheres<Property>
  : never;

export type Wheres<E extends InstanceType<AnEntity>> = {
  [K in keyof E]?: Where<E[K]>;
};
