import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "./builder";

export class ColumnNameColumnIdentifierSqlBuilder extends ColumnIdentifierSqlBuilder {
  alias: string;
  columnName: string;

  cast?: string;

  override sql(): string {
    const cast = this.cast?.length ? `::${this.cast}` : "";

    return `${dQ(this.alias)}.${dQ(this.columnName)}${cast}`;
  }
}
