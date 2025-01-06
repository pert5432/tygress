import { Comparison } from "./comparison";

export class ComparisonWrapper {
  constructor(
    private comparisons: Comparison[],
    private logicalOperator: "AND" | "OR"
  ) {}

  public sql() {
    return `(${this.comparisons
      .map((e) => e.sql())
      .join(` ${this.logicalOperator} `)})`;
  }
}
