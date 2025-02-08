import { NamedParams } from "../../types/named-params";
import { dQ } from "../../utils";
import { ParamBuilder } from "../param-builder";
import { PseudoSQLReplacer } from "../pseudo-sql-replacer";
import { SelectTargetSqlBuilder } from "./select-target";

export class SqlSelectTargetSqlBuilder extends SelectTargetSqlBuilder {
  _sql: string;
  as: string;
  params?: NamedParams;

  public override sql(paramBuilder: ParamBuilder): string {
    const processedSql = this.params
      ? PseudoSQLReplacer.replaceParams(this._sql, this.params, paramBuilder)
      : this._sql;

    return `${processedSql} AS ${dQ(this.as)}`;
  }
}
