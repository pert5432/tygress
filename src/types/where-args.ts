import { WhereComparator } from ".";
import { AnEntity } from "./entity";
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

export class IsNullCondition {
  readonly "@instanceof" = Symbol.for("IsNullCondition");
}

export class IsNotNullCondition {
  readonly "@instanceof" = Symbol.for("IsNotNullCondition");
}

export type ParameterArgs<Property extends Parametrizable> =
  | ParametrizedCondition<Property>
  | ParametrizedConditionWrapper<Property>
  | NotConditionWrapper<Property>;

export type NullCondition = IsNullCondition | IsNotNullCondition;

export type Condition<Property> = Property extends Parametrizable
  ? ParameterArgs<Property> | NullCondition
  : NullCondition;

export type Where<Property> = Property extends Parametrizable
  ? Condition<Property> | Property
  : Property extends Array<infer I>
  ? Wheres<I>
  : Property extends AnEntity | InstanceType<AnEntity>
  ? Wheres<Property>
  : NullCondition | never;

export type Wheres<E extends InstanceType<AnEntity>> = {
  [K in keyof E]?: Where<E[K]>;
};

export type IndexWhere<Property> = Property extends Parametrizable
  ? Condition<Property> | Property | NullCondition
  : never;

export type IndexWheres<E extends InstanceType<AnEntity>> = {
  [K in keyof E]?: IndexWhere<E[K]>;
};
