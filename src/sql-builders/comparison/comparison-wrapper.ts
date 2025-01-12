import { ParamBuilder } from "../param-builder";
import { ComparisonSqlBuilder } from "./comparison-builder";

export class ComparisonWrapper extends ComparisonSqlBuilder {
  constructor(
    private comparisons: ComparisonSqlBuilder[],
    private logicalOperator: "AND" | "OR"
  ) {
    super();
  }

  public sql(paramBuilder: ParamBuilder): string {
    return `(${this.comparisons
      .map((e) => e.sql(paramBuilder))
      .join(` ${this.logicalOperator} `)})`;
  }
}

export class NotComparisonWrapper extends ComparisonSqlBuilder {
  constructor(private comparisons: ComparisonSqlBuilder) {
    super();
  }

  public sql(paramBuilder: ParamBuilder): string {
    return `NOT (${this.comparisons.sql(paramBuilder)})`;
  }
}
