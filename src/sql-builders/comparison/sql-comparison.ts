import { ParamBuilder } from "../param-builder";
import { ComparisonSqlBuilder } from "./comparison-builder";

export class SqlComparison extends ComparisonSqlBuilder {
  public _sql: string;

  public override sql(_paramBuilder: ParamBuilder): string {
    return this._sql;
  }
}
