import { dQ } from "../../utils";
import { ParamBuilder } from "../param-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumNameSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  alias: string;
  columnName: string;

  as?: string;

  public override sql(_paramBuilder: ParamBuilder): string {
    let _sql = `${dQ(this.alias)}.${dQ(this.columnName)}`;

    if (this.as?.length) {
      _sql += ` AS ${dQ(this.as)}`;
    }

    return _sql;
  }
}
