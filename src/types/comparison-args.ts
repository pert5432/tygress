import { WhereComparator } from "./where-comparator";

type ComparisonArgs = {
  leftAlias: string;
  leftColumn: string;
  leftCast?: string;

  comparator: WhereComparator;

  rightCast?: string;
};

export type ColColComparisonArgs = ComparisonArgs & {
  rightAlias: string;
  rightColumn: string;
};

export type ColParamComparisonArgs = ComparisonArgs & {
  paramNumbers: number[];
};
