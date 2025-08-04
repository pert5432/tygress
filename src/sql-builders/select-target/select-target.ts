import { ConstantBuilder } from "../constant-builder";

export abstract class SelectTargetSqlBuilder {
  public abstract sql(constBuilder: ConstantBuilder): string;
}
