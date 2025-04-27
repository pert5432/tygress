import { dQ } from "../../utils";
import { ColumnIdentifierSqlBuilder } from "../column-identifier";
import { ParamBuilder } from "../param-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumnSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  columnIdentifier: ColumnIdentifierSqlBuilder;
  as: string;

  // Needed to match this selected column to query nodes
  nodeAlias: string;
  fieldName: string;

  public override sql(_paramBuilder: ParamBuilder): string {
    return `${this.columnIdentifier.sql()} AS ${dQ(this.as)}`;
  }
}
