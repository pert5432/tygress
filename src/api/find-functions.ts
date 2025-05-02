import {
  ParametrizedConditionFactory,
  ConditionWrapperFactory,
  ConditionFactory,
} from "../factories";
import { ParametrizedCondition } from "../types";
import {
  IsNotNullCondition,
  IsNullCondition,
  NotConditionWrapper,
  ParametrizedConditionWrapper,
} from "../types/where-args";

/**
 * Creates
 * ```sql
 *  a.first_name = $1
 * ```
 */
export const Eq = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("=", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name > $1
 * ```
 */
export const Gt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create(">", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name >= $1
 * ```
 */
export const Gte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create(">=", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name < $1
 * ```
 */
export const Lt = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name <= $1
 * ```
 */
export const Lte = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<=", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name <> $1
 * ```
 */
export const NotEq = <T>(param: T): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("<>", [param]);
};

/**
 * Creates
 * ```sql
 *  a.first_name IN($1, $2)
 * ```
 */
export const In = <T>(params: T[]): ParametrizedCondition<T> => {
  return ParametrizedConditionFactory.create("IN", params);
};

/**
 * Creates
 * ```sql
 *  (condition AND condition)
 * ```
 */
export const And = <T>(
  conditions: ParametrizedCondition<T>[]
): ParametrizedConditionWrapper<T> => {
  return ConditionWrapperFactory.createParametrized(conditions, "AND");
};

/**
 * Creates
 * ```sql
 *  (condition OR condition)
 * ```
 */
export const Or = <T>(
  conditions: ParametrizedCondition<T>[]
): ParametrizedConditionWrapper<T> => {
  return ConditionWrapperFactory.createParametrized(conditions, "OR");
};

/**
 * Creates
 * ```sql
 *  NOT (condition)
 * ```
 */
export const Not = <T>(
  condition: ParametrizedConditionWrapper<T> | ParametrizedCondition<T>
): NotConditionWrapper<T> => {
  return ConditionWrapperFactory.createNot(condition);
};

/**
 * Creates
 * ```sql
 *  a.first_name IS NULL
 * ```
 */
export const IsNull = (): IsNullCondition => ConditionFactory.createIsNull();

/**
 * Creates
 * ```sql
 *  a.first_name IS NOT NULL
 * ```
 */
export const IsNotNull = (): IsNotNullCondition =>
  ConditionFactory.createIsNotNull();
