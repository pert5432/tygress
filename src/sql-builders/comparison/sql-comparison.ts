import { NamedParams } from "../../types/named-params";
import { FieldNameToColumnReplacer } from "../field-name-to-column-replacer";
import { ParamBuilder } from "../param-builder";
import { ComparisonSqlBuilder } from "./comparison-builder";

export class SqlComparison extends ComparisonSqlBuilder {
  public _sql: string;
  public namedParams: NamedParams;

  public override sql(paramBuilder: ParamBuilder): string {
    return FieldNameToColumnReplacer.replaceParams(
      this._sql,
      this.namedParams,
      paramBuilder
    );
  }
}
