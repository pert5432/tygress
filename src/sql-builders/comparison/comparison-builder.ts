import { ConstantBuilder } from "../constant-builder";

export abstract class ComparisonSqlBuilder {
  public abstract sql(constBuilder: ConstantBuilder): string;
}
