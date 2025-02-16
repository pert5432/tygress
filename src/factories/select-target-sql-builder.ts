import { ColumnMetadata } from "../metadata";
import {
  ColumnSelectTargetSqlBuilder,
  SqlSelectTargetSqlBuilder,
} from "../sql-builders";
import { NamedParams } from "../types/named-params";
import { ColumnIdentifierSqlBuilderFactory } from "./column-identifier";

export abstract class SelectTargetSqlBuilderFactory {
  static createColumn(
    alias: string,
    column: ColumnMetadata,
    as: string
  ): ColumnSelectTargetSqlBuilder {
    const e = new ColumnSelectTargetSqlBuilder();

    e.columnIdentifier = ColumnIdentifierSqlBuilderFactory.createColumnMeta(
      alias,
      column
    );
    e.as = as;

    e.nodeAlias = alias;
    e.column = column;

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
