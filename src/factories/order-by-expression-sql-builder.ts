import { ColumnIdentifierSqlBuilder } from "../sql-builders";
import { OrderByColumnExpressionSqlBuilder } from "../sql-builders/order-by-expression";

export abstract class OrderByExpressionSqlBuilderFactory {
  static create(
    columnIdentifier: ColumnIdentifierSqlBuilder,
    order?: "ASC" | "DESC"
  ): OrderByColumnExpressionSqlBuilder {
    const e = new OrderByColumnExpressionSqlBuilder();

    e.columnIdentifier = columnIdentifier;
    e.order = order;

    return e;
  }
}
