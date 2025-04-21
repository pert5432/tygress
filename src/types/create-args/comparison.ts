import {
  ColumnIdentifierSqlBuilder,
  TableIdentifierSqlBuilder,
} from "../../sql-builders";
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

export type ColTableIdentifierComparisonArgs = ComparisonArgs & {
  tableIdentifier: TableIdentifierSqlBuilder;
};

export type ColIsNullComparisonArgs = {
  left: ColumnIdentifierSqlBuilder;
};
