import { dQ } from "../../utils";
import { WHERE_COMPARATORS } from "../../where-comparators";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "../../types/create-args/comparison";
import { ComparisonSqlBuilder } from "./comparison-builder";
import { WhereComparator } from "../../types";

export abstract class Comparison extends ComparisonSqlBuilder {
  leftAlias: string;
  leftColumn: string;
  leftCast?: string;

  comparator: WhereComparator;

  rightAlias?: string;
  rightColumn?: string;

  paramNumbers?: number[];

  rightCast?: string;

  protected abstract _sql(): string;

  public sql(): string {
    return this._sql();
  }

  protected formatCol(alias: string, col: string, cast?: string): string {
    return `${dQ(alias)}.${dQ(col)}${cast ? `::${cast}` : ""}`;
  }

  protected get comparatorF() {
    return WHERE_COMPARATORS[this.comparator];
  }
}

export class ColColComparison extends Comparison {
  constructor({
    leftAlias,
    leftColumn,
    leftCast,
    comparator,
    rightAlias,
    rightColumn,
    rightCast,
  }: ColColComparisonArgs) {
    super();

    this.leftAlias = leftAlias;
    this.leftColumn = leftColumn;
    this.leftCast = leftCast;

    this.comparator = comparator;

    this.rightAlias = rightAlias;
    this.rightColumn = rightColumn;
    this.rightCast = rightCast;
  }

  rightAlias: string;
  rightColumn: string;

  protected _sql(): string {
    const left = this.formatCol(this.leftAlias, this.leftColumn, this.leftCast);
    const right = this.formatCol(
      this.rightAlias,
      this.rightColumn,
      this.rightCast
    );

    return `${left} ${this.comparatorF([right])}`;
  }
}

export class ColParamComparison extends Comparison {
  constructor({
    leftAlias,
    leftColumn,
    leftCast,
    comparator,
    paramNumbers,
    rightCast,
  }: ColParamComparisonArgs) {
    super();

    this.leftAlias = leftAlias;
    this.leftColumn = leftColumn;
    this.leftCast = leftCast;

    this.comparator = comparator;

    this.paramNumbers = paramNumbers;
    this.rightCast = rightCast;
  }

  paramNumbers: number[];

  protected _sql(): string {
    const left = this.formatCol(this.leftAlias, this.leftColumn, this.leftCast);
    const right = this.paramNumbers!?.map(
      (p) => `$${p}${this.rightCast ? `::${this.rightCast}` : ""}`
    );

    return `${left} ${this.comparatorF(right)}`;
  }
}
