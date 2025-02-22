import { ColumnIdentifierSqlBuilder } from "../column-identifier";
import { OrderByExpressionSqlBuilder } from "./builder";

export class OrderByColumnExpressionSqlBuilder extends OrderByExpressionSqlBuilder {
  columnIdentifier: ColumnIdentifierSqlBuilder;
  order?: "ASC" | "DESC";

  override sql(): string {
    const order = this.order?.length ? ` ${this.order}` : "";

    return `${this.columnIdentifier.sql()}${order}`;
  }
}
