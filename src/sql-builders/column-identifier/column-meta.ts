import { ColumnMetadata } from "../../metadata";
import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "./builder";

export class ColumnMetadataColumnIdentifierSqlBuilder extends ColumnIdentifierSqlBuilder {
  alias: string;
  column: ColumnMetadata;

  override sql(): string {
    return `${dQ(this.alias)}.${dQ(this.column.name)}`;
  }
}
