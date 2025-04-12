import { JoinType } from "../../enums";
import {
  ComparisonSqlBuilder,
  TableIdentifierSqlBuilder,
} from "../../sql-builders";
import { AnEntity } from "../entity";

export class JoinArg {
  klass: AnEntity;
  alias: string;

  // Undefined for root node
  type?: JoinType;

  childType: "entity" | "cte";

  identifier: TableIdentifierSqlBuilder;

  // Undefined for root node
  comparison?: ComparisonSqlBuilder;
  parentAlias?: string;
  parentField?: string;

  select?: boolean;
}
