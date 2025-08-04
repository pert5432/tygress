import { NamedParams } from "../../types/named-params";
import { PseudoSQLReplacer } from "../pseudo-sql-replacer";
import { ConstantBuilder } from "../constant-builder";
import { ComparisonSqlBuilder } from "./comparison-builder";

export class SqlComparison extends ComparisonSqlBuilder {
  public _sql: string;
  public namedParams: NamedParams;

  public override sql(constBuilder: ConstantBuilder): string {
    return PseudoSQLReplacer.replaceParams(
      this._sql,
      this.namedParams,
      constBuilder
    );
  }
}
