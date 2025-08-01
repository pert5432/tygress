import { ConstantBuilder } from "../constant-builder";
import { ComparisonSqlBuilder } from "./comparison-builder";

export class ComparisonWrapper extends ComparisonSqlBuilder {
  constructor(
    private comparisons: ComparisonSqlBuilder[],
    private logicalOperator: "AND" | "OR"
  ) {
    super();
  }

  public sql(constBuilder: ConstantBuilder): string {
    return `(${this.comparisons
      .map((e) => e.sql(constBuilder))
      .join(` ${this.logicalOperator} `)})`;
  }
}

export class NotComparisonWrapper extends ComparisonSqlBuilder {
  constructor(private comparisons: ComparisonSqlBuilder) {
    super();
  }

  public sql(constBuilder: ConstantBuilder): string {
    return `NOT (${this.comparisons.sql(constBuilder)})`;
  }
}
