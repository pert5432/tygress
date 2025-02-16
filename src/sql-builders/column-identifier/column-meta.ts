import { ColumnMetadata } from "../../metadata";
import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "./builder";

export class ColumnMetadataColumnIdentifierSqlBuilder extends ColumnIdentifierSqlBuilder {
  alias: string;
  column: ColumnMetadata;

  cast?: string;

  override sql(): string {
    const cast = this.cast?.length ? `::${this.cast}` : "";

    return `${dQ(this.alias)}.${dQ(this.column.name)}${cast}`;
  }
}
