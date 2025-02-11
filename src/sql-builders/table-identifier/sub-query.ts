import { QueryResultType } from "../../enums";
import { QueryBuilder } from "../../query-builder";
import { dQ } from "../../utils";
import { ParamBuilder } from "../param-builder";
import { TableIdentifierSqlBuilder } from "./builder";

export class SubQueryTableIdentifierSqlBuilder extends TableIdentifierSqlBuilder {
  alias: string; // This is the name of the subquery
  qb: QueryBuilder<any, any, any, any>;

  columnList?: string[];

  override sql(paramBuilder: ParamBuilder): string {
    const innerQuery = this.qb.getQuery(QueryResultType.RAW, paramBuilder).sql;

    const columnList = this.columnList?.length
      ? `(${this.columnList.map((e) => dQ(e)).join(", ")})`
      : "";

    return `(${innerQuery}) ${dQ(this.alias)}${columnList}`;
  }
}
