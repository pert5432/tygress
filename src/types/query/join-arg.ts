import {
  ComparisonSqlBuilder,
  TableIdentifierSqlBuilder,
} from "../../sql-builders";
import { AnEntity } from "../entity";

export class JoinArg {
  klass: AnEntity;
  alias: string;

  type: "entity" | "cte";

  identifier: TableIdentifierSqlBuilder;

  // Undefined for root node
  comparison?: ComparisonSqlBuilder;
  parentAlias?: string;
  parentField?: string;

  select?: boolean;
}
