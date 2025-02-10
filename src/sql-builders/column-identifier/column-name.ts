import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "./builder";

export class ColumnNameColumnIdentifierSqlBuilder extends ColumnIdentifierSqlBuilder {
  alias: string;
  columnName: string;

  override sql(): string {
    return `${dQ(this.alias)}.${dQ(this.columnName)}`;
  }
}
