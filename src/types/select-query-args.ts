import { QueryResultType } from "../enums";
import {
  ColumnIdentifierSqlBuilder,
  ComparisonSqlBuilder,
  SelectTargetSqlBuilder,
} from "../sql-builders";
import { AnEntity } from "./entity";
import { JoinArg } from "./query/join-arg";
import { SelectQueryOrder } from "./select-query-order";

export type SelectQueryArgs = {
  resultType: QueryResultType;

  joins: JoinArg<AnEntity>[];

  selects?: SelectTargetSqlBuilder[];

  wheres?: ComparisonSqlBuilder[];

  orderBys?: SelectQueryOrder[];

  groupBys?: ColumnIdentifierSqlBuilder[];

  limit?: number;

  offset?: number;
};
