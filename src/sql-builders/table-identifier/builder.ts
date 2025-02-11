import { ParamBuilder } from "../param-builder";

export abstract class TableIdentifierSqlBuilder {
  abstract sql(paramBuilder: ParamBuilder): string;
}
