import { ParametrizedCondition } from "../types";
import { ParametrizedConditionWrapper } from "../types/where-args";

export abstract class ParametrizedConditionWrapperFactory {
  public static create<V>(
    conditions: ParametrizedCondition<V>[],
    logicalOperator: "AND" | "OR"
  ): ParametrizedConditionWrapper<V> {
    const e = new ParametrizedConditionWrapper<V>();

    e.conditions = conditions;
    e.logicalOperator = logicalOperator;

    return e;
  }
}
