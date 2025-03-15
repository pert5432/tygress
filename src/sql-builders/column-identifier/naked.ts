import { ColumnMetadata } from "../../metadata";
import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "./builder";

export class NakedColumnIdentifierSqlBuilder extends ColumnIdentifierSqlBuilder {
  column: ColumnMetadata;

  override sql(): string {
    return dQ(this.column.name);
  }
}
