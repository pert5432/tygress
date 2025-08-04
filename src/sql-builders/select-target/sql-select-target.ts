import { NamedParams } from "../../types/named-params";
import { dQ } from "../../utils";
import { ConstantBuilder } from "../constant-builder";
import { PseudoSQLReplacer } from "../pseudo-sql-replacer";
import { SelectTargetSqlBuilder } from "./select-target";

export class SqlSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  _sql: string;
  as: string;
  params?: NamedParams;

  public override sql(constBuilder: ConstantBuilder): string {
    const processedSql = this.params
      ? PseudoSQLReplacer.replaceParams(this._sql, this.params, constBuilder)
      : this._sql;

    return `${processedSql} AS ${dQ(this.as)}`;
  }
}
