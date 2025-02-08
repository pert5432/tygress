import { ColumnMetadata } from "../../metadata";
import { dQ } from "../../utils";
import { ParamBuilder } from "../param-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumnSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  alias: string;
  column: ColumnMetadata;
  as?: string;

  public override sql(_paramBuilder: ParamBuilder): string {
    const targetAlias = this.as?.length
      ? dQ(this.as)
      : dQ(`${this.alias}.${this.column.fieldName}`);

    return `${dQ(this.alias)}.${dQ(this.column.name)} AS ${targetAlias}`;
  }
}
