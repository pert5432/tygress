import { ParametrizedConditionFactory } from "../factories";
import { ParametrizedCondition } from "../types";

export const In = <T>(params: T[]): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("in", params);
};

export const Gt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("gt", [param]);
};

export const Gte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("gte", [param]);
};

export const Lt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("lt", [param]);
};

export const Lte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("lte", [param]);
};

export const NotEq = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("not-eq", [param]);
};
