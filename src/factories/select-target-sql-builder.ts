import { ColumnMetadata } from "../metadata";
import {
  ColumnSelectTargetSqlBuilder,
  SqlSelectTargetSqlBuilder,
} from "../sql-builders";
import { NamedParams } from "../types/named-params";

export abstract class SelectTargetSqlBuilderFactory {
  static createColumn(
    alias: string,
    column: ColumnMetadata,
    as?: string
  ): ColumnSelectTargetSqlBuilder {
    const e = new ColumnSelectTargetSqlBuilder();

    e.alias = alias;
    e.column = column;
    e.as = as;

    return e;
  }

  static createSql(
    sql: string,
    as: string,
    params?: NamedParams
  ): SqlSelectTargetSqlBuilder {
    const e = new SqlSelectTargetSqlBuilder();

    e._sql = sql;
    e.as = as;
    e.params = params;

    return e;
  }
}
