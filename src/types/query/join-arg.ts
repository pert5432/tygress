import { ComparisonSqlBuilder } from "../../sql-builders";
import { AnEntity } from "../entity";

export class JoinArg<T extends AnEntity> {
  klass: T;
  alias: string;

  // Undefined for root node
  comparison?: ComparisonSqlBuilder;

  parentAlias?: string;
  parentField?: string;
}
