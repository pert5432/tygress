type ComparisonArgs = {
  leftAlias: string;
  leftColumn: string;
  leftCast?: string;

  comparator: string;

  rightCast?: string;
};

export type ColColComparisonArgs = ComparisonArgs & {
  rightAlias: string;
  rightColumn: string;
};

export type ColParamComparisonArgs = ComparisonArgs & {
  rightParamNumber: number;
};
