import { RelationMetadata } from "../metadata";
import {
  ColumnIdentifierSqlBuilder,
  ComparisonSqlBuilder,
  ComparisonWrapper,
  NotComparisonWrapper,
  TableIdentifierSqlBuilder,
} from "../sql-builders";
import { SqlComparison } from "../sql-builders/comparison";
import {
  ColColComparison,
  ColIsNotNullComparison,
  ColIsNullComparison,
  ColParamComparison,
  ColTableIdentifierComparison,
} from "../sql-builders/comparison/comparison";
import { AnEntity, Parametrizable, WhereComparator } from "../types";
import { NamedParams } from "../types/named-params";
import {
  Condition,
  IsNotNullCondition,
  IsNullCondition,
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedCondition,
  ParametrizedConditionWrapper,
} from "../types/where-args";
import { ColumnIdentifierSqlBuilderFactory } from "./column-identifier";

export abstract class ComparisonFactory {
  public static createColColIdentifiers(
    left: ColumnIdentifierSqlBuilder,
    comparator: WhereComparator,
    right: ColumnIdentifierSqlBuilder
  ): ColColComparison {
    return new ColColComparison({ left, right, comparator });
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

  public static createColIsNull(
    left: ColumnIdentifierSqlBuilder
  ): ColIsNullComparison {
    return new ColIsNullComparison({ left });
  }

  public static createColIsNotNull(
    left: ColumnIdentifierSqlBuilder
  ): ColIsNotNullComparison {
    return new ColIsNotNullComparison({ left });
  }

  public static colTableIdentifier(
    left: ColumnIdentifierSqlBuilder,
    comparator: WhereComparator,
    tableIdentifier: TableIdentifierSqlBuilder
  ): ColTableIdentifierComparison {
    return new ColTableIdentifierComparison({
      left,
      comparator,
      tableIdentifier,
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

    return this.createColColIdentifiers(
      ColumnIdentifierSqlBuilderFactory.createColumnMeta(
        foreignAlias,
        relation.foreignColumn
      ),
      "=",
      ColumnIdentifierSqlBuilderFactory.createColumnMeta(
        primaryAlias,
        relation.primaryColumn
      )
    );
  }

  public static createFromConditionIdentifier(
    columnIdentifier: ColumnIdentifierSqlBuilder,
    condition: Condition<Parametrizable>
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
      // TODO: refactor to util function
      typeof condition === "number" ||
      typeof condition === "bigint" ||
      typeof condition === "string" ||
      typeof condition === "boolean" ||
      condition instanceof Date
    ) {
      return this.createColParamIdentifier(columnIdentifier, "=", [condition]);
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
    } else if ((condition as Object) instanceof IsNullCondition) {
      return this.createColIsNull(columnIdentifier);
    } else if ((condition as Object) instanceof IsNotNullCondition) {
      return this.createColIsNotNull(columnIdentifier);
    } else {
      throw new Error(`bogus condition ${condition}`);
    }
  }
}
