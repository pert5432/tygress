import { ParametrizedCondition } from "../types";
import {
  NotConditionWrapper,
  ParametrizedConditionWrapper,
} from "../types/where-args";

export abstract class ConditionWrapperFactory {
  public static createParametrized<V>(
    conditions: ParametrizedCondition<V>[],
    logicalOperator: "AND" | "OR"
  ): ParametrizedConditionWrapper<V> {
    if (!conditions.length) {
      throw new Error(
        `Condition wrapper needs a non-empty array of conditions`
      );
    }

    const e = new ParametrizedConditionWrapper<V>();

    e.conditions = conditions;
    e.logicalOperator = logicalOperator;

    return e;
  }

  public static createNot<V>(
    condition: ParametrizedConditionWrapper<V> | ParametrizedCondition<V>
  ): NotConditionWrapper<V> {
    // Create a wrapper with one condition if the argument is a simple condition
    // The logicalOperator here does not matter because its only one condition
    const wrapper =
      condition instanceof ParametrizedConditionWrapper
        ? condition
        : this.createParametrized([condition], "AND");

    const e = new NotConditionWrapper<V>();

    e.condition = wrapper;

    return e;
  }
}
