import { ComparisonType } from "../enums";
import { dQ } from "../utils";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "./comparison-args";

export abstract class Comparison {
  type: ComparisonType;

  leftAlias: string;
  leftColumn: string;
  leftCast?: string;

  comparator: string;

  rightAlias?: string;
  rightColumn?: string;

  rightParamNumber?: number;

  rightCast?: string;

  public sql(): string {
    const left = `${dQ(this.leftAlias)}.${dQ(this.leftColumn)}${
      this.leftCast ? `::${this.leftCast}` : ``
    }`;

    return `${left} ${this.comparator} ${this.rightSql()}`;
  }

  private rightSql(): string {
    switch (this.type) {
      case ComparisonType.COL_COL:
        return `${dQ(this.rightAlias)}.${dQ(this.rightColumn)}${
          this.leftCast ? `::${this.leftCast}` : ``
        }`;
      case ComparisonType.COL_PARAM:
        return `$${this.rightParamNumber}${
          this.rightCast ? `::${this.rightCast}` : ""
        }`;
      default:
        throw new Error(`Invalid comparison type ${this.type}`);
    }
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

  readonly type = ComparisonType.COL_COL;

  rightAlias: string;
  rightColumn: string;
}

export class ColParamComparison extends Comparison {
  constructor({
    leftAlias,
    leftColumn,
    leftCast,
    comparator,
    rightParamNumber,
    rightCast,
  }: ColParamComparisonArgs) {
    super();

    this.leftAlias = leftAlias;
    this.leftColumn = leftColumn;
    this.leftCast = leftCast;

    this.comparator = comparator;

    this.rightParamNumber = rightParamNumber;
    this.rightCast = rightCast;
  }

  readonly type = ComparisonType.COL_PARAM;

  rightParamNumber: number;
}
