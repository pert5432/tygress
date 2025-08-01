import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "../column-identifier";
import { ConstantBuilder } from "../constant-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumnSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  columnIdentifier: ColumnIdentifierSqlBuilder;
  as: string;

  // Needed to match this selected column to query nodes
  nodeAlias: string;
  fieldName: string;

  public override sql(_constBuilder: ConstantBuilder): string {
    return `${this.columnIdentifier.sql()} AS ${dQ(this.as)}`;
  }
}
