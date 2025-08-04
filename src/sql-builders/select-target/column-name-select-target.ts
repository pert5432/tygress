import { dQ } from "../../utils";
import { ConstantBuilder } from "../constant-builder";
import { SelectTargetSqlBuilder } from "./select-target";

export class ColumNameSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  alias: string;
  columnName: string;

  as?: string;

  public override sql(_constBuilder: ConstantBuilder): string {
    let _sql = `${dQ(this.alias)}.${dQ(this.columnName)}`;

    if (this.as?.length) {
      _sql += ` AS ${dQ(this.as)}`;
    }

    return _sql;
  }
}
