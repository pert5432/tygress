import { IsNotNullCondition, IsNullCondition } from "../types/where-args";

export abstract class ConditionFactory {
  public static createIsNull(): IsNullCondition {
    return new IsNullCondition();
  }

  public static createIsNotNull(): IsNotNullCondition {
    return new IsNotNullCondition();
  }
}
