import {
  ParametrizedConditionFactory,
  ConditionWrapperFactory,
} from "../factories";
import { ParametrizedCondition } from "../types";
import {
  NotConditionWrapper,
  ParametrizedConditionWrapper,
} from "../types/where-args";

export const Eq = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("=", [param]);
};

export const Gt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create(">", [param]);
};

export const Gte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create(">=", [param]);
};

export const Lt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<", [param]);
};

export const Lte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<=", [param]);
};

export const NotEq = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<>", [param]);
};

export const In = <T>(params: T[]): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("IN", params);
};

export const And = <T>(
  conditions: ParametrizedCondition<T>[]
): ParametrizedConditionWrapper<T> => {
  return ConditionWrapperFactory.createParametrized(conditions, "AND");
};

export const Or = <T>(
  conditions: ParametrizedCondition<T>[]
): ParametrizedConditionWrapper<T> => {
  return ConditionWrapperFactory.createParametrized(conditions, "OR");
};

export const Not = <T>(
  condition: ParametrizedConditionWrapper<T> | ParametrizedCondition<T>
): NotConditionWrapper<T> => {
  return ConditionWrapperFactory.createNot(condition);
};
