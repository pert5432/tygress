import { Parametrizable, ParametrizedCondition, SqlCondition } from "..";

export class ConditionWrapper<V extends Parametrizable> {
  readonly "@instanceof" = Symbol.for("ConditionWrapper");

  logicalOperator: "AND" | "OR";
  conditions: ParametrizedCondition<V>[] | SqlCondition[];
}
