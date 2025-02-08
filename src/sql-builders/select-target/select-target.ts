import { ParamBuilder } from "../param-builder";

export abstract class SelectTargetSqlBuilder {
  public abstract sql(paramBuilder: ParamBuilder): string;
}
