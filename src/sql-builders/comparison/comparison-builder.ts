import { ParamBuilder } from "../param-builder";

export abstract class ComparisonSqlBuilder {
  public abstract sql(paramBuilder: ParamBuilder): string;
}
