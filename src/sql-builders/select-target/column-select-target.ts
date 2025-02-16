import { ColumnMetadata } from "../../metadata";
import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "../column-identifier";
import { ParamBuilder } from "../param-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumnSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  columnIdentifier: ColumnIdentifierSqlBuilder;
  as: string;

  // Needed to match this selected column to query nodes
  nodeAlias: string;
  column: ColumnMetadata;

  public override sql(_paramBuilder: ParamBuilder): string {
    return `${this.columnIdentifier.sql()} AS ${dQ(this.as)}`;
  }
}
