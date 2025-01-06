import { ParametrizedCondition, WhereComparator } from "../types";

export abstract class ParametrizedConditionFactory {
  public static create<V>(
    comparator: WhereComparator,
    parameters: V[]
  ): ParametrizedCondition<V> {
    const e = new ParametrizedCondition<V>();

    e.comparator = comparator;
    e.parameters = parameters;

    return e;
  }
}
