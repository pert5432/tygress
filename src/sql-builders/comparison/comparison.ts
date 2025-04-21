import { WHERE_COMPARATORS } from "../../where-comparators";
import {
  ColColComparisonArgs,
  ColIsNullComparisonArgs,
  ColParamComparisonArgs,
  ColTableIdentifierComparisonArgs,
} from "../../types/create-args/comparison";
import { ComparisonSqlBuilder } from "./comparison-builder";
import { WhereComparator } from "../../types";
import { ParamBuilder } from "../param-builder";
import { ColumnIdentifierSqlBuilder } from "../column-identifier";
import { TableIdentifierSqlBuilder } from "../table-identifier";

export abstract class Comparison extends ComparisonSqlBuilder {
  left: ColumnIdentifierSqlBuilder;
  comparator: WhereComparator;

  protected get comparatorF() {
    return WHERE_COMPARATORS[this.comparator];
  }
}

export class ColColComparison extends Comparison {
  constructor({ left, comparator, right }: ColColComparisonArgs) {
    super();

    this.left = left;
    this.comparator = comparator;
    this.right = right;
  }

  right: ColumnIdentifierSqlBuilder;

  public sql(): string {
    return `${this.left.sql()} ${this.comparatorF([this.right.sql()])}`;
  }
}

export class ColParamComparison extends Comparison {
  constructor({ left, comparator, params, rightCast }: ColParamComparisonArgs) {
    super();

    this.left = left;

    this.comparator = comparator;

    this.params = params;
    this.rightCast = rightCast;
  }

  params: any[];
  rightCast?: string;

  public sql(paramBuilder: ParamBuilder): string {
    const right = this.params
      ?.map((val) => paramBuilder.addParam(val))
      .map((pNum) => `$${pNum}${this.rightCast ? `::${this.rightCast}` : ""}`);

    return `${this.left.sql()} ${this.comparatorF(right)}`;
  }
}

export class ColIsNullComparison extends Comparison {
  constructor({ left }: ColIsNullComparisonArgs) {
    super();

    this.left = left;
  }

  public sql(): string {
    return `${this.left.sql()} IS NULL`;
  }
}

export class ColIsNotNullComparison extends Comparison {
  constructor({ left }: ColIsNullComparisonArgs) {
    super();

    this.left = left;
  }

  public sql(): string {
    return `${this.left.sql()} IS NOT NULL`;
  }
}

export class ColTableIdentifierComparison extends Comparison {
  constructor({
    left,
    comparator,
    tableIdentifier,
  }: ColTableIdentifierComparisonArgs) {
    super();

    this.left = left;
    this.comparator = comparator;
    this.tableIdentifier = tableIdentifier;
  }

  tableIdentifier: TableIdentifierSqlBuilder;

  public sql(paramBuilder: ParamBuilder): string {
    return `${this.left.sql()} ${this.comparatorF([
      this.tableIdentifier.sql(paramBuilder),
    ])}`;
  }
}
