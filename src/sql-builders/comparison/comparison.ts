import { dQ } from "../../utils";
import { WHERE_COMPARATORS } from "../../where-comparators";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "../../types/create-args/comparison";
import { ComparisonSqlBuilder } from "./comparison-builder";
import { WhereComparator } from "../../types";
import { ParamBuilder } from "../param-builder";

export abstract class Comparison extends ComparisonSqlBuilder {
  leftAlias: string;
  leftColumn: string;
  leftCast?: string;

  comparator: WhereComparator;

  rightAlias?: string;
  rightColumn?: string;

  params?: any[];

  rightCast?: string;

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

  override rightAlias: string;
  override rightColumn: string;

  public sql(): string {
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
    params,
    rightCast,
  }: ColParamComparisonArgs) {
    super();

    this.leftAlias = leftAlias;
    this.leftColumn = leftColumn;
    this.leftCast = leftCast;

    this.comparator = comparator;

    this.params = params;
    this.rightCast = rightCast;
  }

  override params: any[];

  public sql(paramBuilder: ParamBuilder): string {
    const left = this.formatCol(this.leftAlias, this.leftColumn, this.leftCast);
    const right = this.params
      ?.map((val) => paramBuilder.addParam(val))
      .map((pNum) => `$${pNum}${this.rightCast ? `::${this.rightCast}` : ""}`);

    return `${left} ${this.comparatorF(right)}`;
  }
}
