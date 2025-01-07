import { ComparisonSqlBuilder } from "./comparison-builder";

export class ComparisonWrapper extends ComparisonSqlBuilder {
  constructor(
    private comparisons: ComparisonSqlBuilder[],
    private logicalOperator: "AND" | "OR"
  ) {
    super();
  }

  public sql(): string {
    return `(${this.comparisons
      .map((e) => e.sql())
      .join(` ${this.logicalOperator} `)})`;
  }
}

export class NotComparisonWrapper extends ComparisonSqlBuilder {
  constructor(private comparisons: ComparisonSqlBuilder) {
    super();
  }

  public sql(): string {
    return `NOT (${this.comparisons.sql()})`;
  }
}
