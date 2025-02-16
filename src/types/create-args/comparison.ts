import { ColumnIdentifierSqlBuilder } from "../../sql-builders";
import { WhereComparator } from "../where-comparator";

type ComparisonArgs = {
  left: ColumnIdentifierSqlBuilder;

  comparator: WhereComparator;
};

export type ColColComparisonArgs = ComparisonArgs & {
  right: ColumnIdentifierSqlBuilder;
};

export type ColParamComparisonArgs = ComparisonArgs & {
  params: any[];
  rightCast?: string;
};
