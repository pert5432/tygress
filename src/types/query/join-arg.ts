import { JoinType } from "../../enums";
import {
  ComparisonSqlBuilder,
  ConstantBuilder,
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

  sql(constBuilder: ConstantBuilder): string {
    if (!this.type) {
      throw new Error(`Can't construct SQL of a join with no type`);
    }

    if (this.type === JoinType.CROSS) {
      return `CROSS JOIN ${this.identifier.sql(constBuilder)}`;
    }

    return `${this.type} JOIN ${this.identifier.sql(
      constBuilder
    )} ON ${this.comparison!.sql(constBuilder)}`;
  }
}
