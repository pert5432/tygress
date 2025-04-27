import { QueryResultType } from "../enums";
import {
  ColumnIdentifierSqlBuilder,
  ComparisonSqlBuilder,
  SelectTargetSqlBuilder,
} from "../sql-builders";
import { OrderByExpressionSqlBuilder } from "../sql-builders/order-by-expression";
import { CteTableIdentifierSqlBuilder } from "../sql-builders/table-identifier";
import { JoinArg } from "./query/join-arg";

export type SelectQueryArgs = {
  resultType: QueryResultType;

  joins: JoinArg[];

  selects: SelectTargetSqlBuilder[];

  wheres?: ComparisonSqlBuilder[];

  orderBys?: OrderByExpressionSqlBuilder[];

  groupBys?: ColumnIdentifierSqlBuilder[];

  with?: CteTableIdentifierSqlBuilder[];

  limit?: number;

  offset?: number;

  distinct?: boolean;

  distinctOn?: ColumnIdentifierSqlBuilder[];
};
