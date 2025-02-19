import { ColumnMetadata, RelationMetadata } from "../metadata";
import {
  ColumnIdentifierSqlBuilder,
  ComparisonSqlBuilder,
  ComparisonWrapper,
  NotComparisonWrapper,
} from "../sql-builders";
import { SqlComparison } from "../sql-builders/comparison";
import {
  ColColComparison,
  ColParamComparison,
} from "../sql-builders/comparison/comparison";
import { AnEntity, Parametrizable, WhereComparator } from "../types";
import { NamedParams } from "../types/named-params";
import {
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedCondition,
  ParametrizedConditionWrapper,
} from "../types/where-args";
import { ColumnIdentifierSqlBuilderFactory } from "./column-identifier";

export abstract class ComparisonFactory {
  public static createColCol(
    leftAlias: string,
    leftColumn: ColumnMetadata,
    comparator: WhereComparator,
    rightAlias: string,
    rightColumn: ColumnMetadata
  ): ColColComparison {
    const left = ColumnIdentifierSqlBuilderFactory.createColumnMeta(
      leftAlias,
      leftColumn
    );
    const right = ColumnIdentifierSqlBuilderFactory.createColumnMeta(
      rightAlias,
      rightColumn
    );

    return new ColColComparison({ left, right, comparator });
  }

  public static createColColIdentifiers(
    left: ColumnIdentifierSqlBuilder,
    comparator: WhereComparator,
    right: ColumnIdentifierSqlBuilder
  ): ColColComparison {
    return new ColColComparison({ left, right, comparator });
  }

  public static createColParam(
    leftAlias: string,
    leftColumn: ColumnMetadata,
    comparator: WhereComparator,
    params: any[],
    cast?: string
  ): ColParamComparison {
    const left = ColumnIdentifierSqlBuilderFactory.createColumnMeta(
      leftAlias,
      leftColumn
    );

    return new ColParamComparison({
      left,
      comparator,
      params,
      rightCast: cast,
    });
  }

  public static createColParamIdentifier(
    left: ColumnIdentifierSqlBuilder,
    comparator: WhereComparator,
    params: any[],
    cast?: string
  ): ColParamComparison {
    return new ColParamComparison({
      left,
      comparator,
      params,
      rightCast: cast,
    });
  }

  public static createSql(
    sql: string,
    namedParams: NamedParams
  ): SqlComparison {
    const e = new SqlComparison();

    e._sql = sql;
    e.namedParams = namedParams;

    return e;
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

    return this.createColCol(
      foreignAlias,
      relation.foreignColumn,
      "eq",
      primaryAlias,
      relation.primaryColumn
    );
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

      return this.createColParam(
        alias,
        column,
        parametrizedCondition.comparator,
        parametrizedCondition.parameters
      );
    } else if (
      typeof condition === "number" ||
      typeof condition === "string" ||
      typeof condition === "boolean"
    ) {
      return this.createColParam(alias, column, "eq", [condition]);
    } else if ((condition as Object) instanceof ParametrizedConditionWrapper) {
      const conditionWrapper =
        condition as ParametrizedConditionWrapper<Parametrizable>;

      const comparisons = conditionWrapper.conditions.map((c) =>
        this.createColParam(alias, column, c.comparator, c.parameters)
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

  public static createFromConditionIdentifier(
    columnIdentifier: ColumnIdentifierSqlBuilder,
    condition: ParameterArgs<Parametrizable>
  ): ComparisonSqlBuilder {
    if ((condition as Object) instanceof ParametrizedCondition) {
      // To get type safety because inference doesn't work here for some reason ¯\_(ツ)_/¯
      const parametrizedCondition =
        condition as ParametrizedCondition<Parametrizable>;

      return this.createColParamIdentifier(
        columnIdentifier,
        parametrizedCondition.comparator,
        parametrizedCondition.parameters
      );
    } else if (
      typeof condition === "number" ||
      typeof condition === "string" ||
      typeof condition === "boolean"
    ) {
      return this.createColParamIdentifier(columnIdentifier, "eq", [condition]);
    } else if ((condition as Object) instanceof ParametrizedConditionWrapper) {
      const conditionWrapper =
        condition as ParametrizedConditionWrapper<Parametrizable>;

      const comparisons = conditionWrapper.conditions.map((c) =>
        this.createColParamIdentifier(
          columnIdentifier,
          c.comparator,
          c.parameters
        )
      );

      return new ComparisonWrapper(
        comparisons,
        conditionWrapper.logicalOperator
      );
    } else if ((condition as Object) instanceof NotConditionWrapper) {
      const notConditionWrapper =
        condition as NotConditionWrapper<Parametrizable>;

      return new NotComparisonWrapper(
        this.createFromConditionIdentifier(
          columnIdentifier,
          notConditionWrapper.condition
        )
      );
    } else {
      throw new Error(`bogus condition ${condition}`);
    }
  }
}
