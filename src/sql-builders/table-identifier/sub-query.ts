import { QueryResultType } from "../../enums";
import { QueryBuilder } from "../../query-builder";
import { dQ } from "../../utils";
import { ConstantBuilder } from "../constant-builder";
import { TableIdentifierSqlBuilder } from "./builder";

export class SubQueryTableIdentifierSqlBuilder extends TableIdentifierSqlBuilder {
  alias?: string; // This is the name of the subquery
  qb: QueryBuilder<any>;

  columnList?: string[];

  override sql(constBuilder: ConstantBuilder): string {
    const innerQuery = this.qb.getQuery(QueryResultType.RAW, constBuilder).sql;

    const columnList = this.columnList?.length
      ? `(${this.columnList.map((e) => dQ(e)).join(", ")})`
      : "";

    const identifier = this.alias?.length
      ? ` ${dQ(this.alias)}${columnList}`
      : "";

    return `(${innerQuery})${identifier}`;
  }
}
