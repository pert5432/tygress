import { JoinType } from "../../enums";
import {
  ComparisonSqlBuilder,
  ParamBuilder,
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

  // Undefined for root node or cross joins
  comparison?: ComparisonSqlBuilder;

  // Undefined for root node
  parentAlias?: string;
  parentField?: string;

  select?: boolean;
  map?: boolean;

  sql(paramBuilder: ParamBuilder): string {
    if (!this.type) {
      throw new Error(`Can't construct SQL of a join with no type`);
    }

    if (this.type === JoinType.CROSS) {
      return `CROSS JOIN ${this.identifier.sql(paramBuilder)}`;
    }

    return `${this.type} JOIN ${this.identifier.sql(
      paramBuilder
    )} ON ${this.comparison!.sql(paramBuilder)}`;
  }
}
