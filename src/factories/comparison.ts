import { ColumnMetadata, RelationMetadata } from "../metadata";
import {
  ComparisonSqlBuilder,
  ComparisonWrapper,
  NotComparisonWrapper,
} from "../sql-builders";
import {
  ColColComparison,
  ColParamComparison,
} from "../sql-builders/comparison/comparison";
import { AnEntity, Parametrizable } from "../types";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "../types/create-args/comparison";
import {
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedCondition,
  ParametrizedConditionWrapper,
} from "../types/where-args";

export abstract class ComparisonFactory {
  public static createColCol(args: ColColComparisonArgs): ColColComparison {
    return new ColColComparison(args);
  }

  public static createColParam(
    args: ColParamComparisonArgs
  ): ColParamComparison {
    return new ColParamComparison(args);
  }

  public static createJoin(
    parentAlias: string,
    parentKlass: AnEntity,
    childAlias: string,
    relation: RelationMetadata
  ): ColColComparison {
    const [primaryAlias, foreignAlias] =
      relation.primary === parentKlass
        ? [parentAlias, childAlias]
        : [childAlias, parentAlias];

    return this.createColCol({
      leftAlias: foreignAlias,
      leftColumn: relation.foreignKey,
      comparator: "eq",
      rightAlias: primaryAlias,
      rightColumn: relation.primaryKey,
    });
  }

  public static createFromCondition(
    alias: string,
    column: ColumnMetadata,
    condition: ParameterArgs<Parametrizable>
  ): ComparisonSqlBuilder {
    if ((condition as Object) instanceof ParametrizedCondition) {
      // To get type safety because inference doesn't work here for some reason ¯\_(ツ)_/¯
      const parametrizedCondition =
        condition as ParametrizedCondition<Parametrizable>;

      return this.createColParam({
        leftAlias: alias,
        leftColumn: column.name,
        comparator: parametrizedCondition.comparator,
        params: parametrizedCondition.parameters,
      });
    } else if (
      typeof condition === "number" ||
      typeof condition === "string" ||
      typeof condition === "boolean"
    ) {
      return this.createColParam({
        leftAlias: alias,
        leftColumn: column.name,
        comparator: "eq",
        params: [condition],
      });
    } else if ((condition as Object) instanceof ParametrizedConditionWrapper) {
      const conditionWrapper =
        condition as ParametrizedConditionWrapper<Parametrizable>;

      const comparisons = conditionWrapper.conditions.map((c) =>
        this.createColParam({
          leftAlias: alias,
          leftColumn: column.name,
          comparator: c.comparator,
          params: c.parameters,
        })
      );

      return new ComparisonWrapper(
        comparisons,
        conditionWrapper.logicalOperator
      );
    } else if ((condition as Object) instanceof NotConditionWrapper) {
      const notConditionWrapper =
        condition as NotConditionWrapper<Parametrizable>;

      return new NotComparisonWrapper(
        this.createFromCondition(alias, column, notConditionWrapper.condition)
      );
    } else {
      throw new Error(`bogus condition ${condition}`);
    }
  }
}
