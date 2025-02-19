import {
  ColumnIdentifierSqlBuilder,
  ColumnSelectTargetSqlBuilder,
  SqlSelectTargetSqlBuilder,
} from "../sql-builders";
import { NamedParams } from "../types/named-params";

export abstract class SelectTargetSqlBuilderFactory {
  static createColumnIdentifier(
    columnIdentifier: ColumnIdentifierSqlBuilder,
    as: string,
    nodeAlias?: string,
    fieldName?: string
  ): ColumnSelectTargetSqlBuilder {
    const e = new ColumnSelectTargetSqlBuilder();

    e.columnIdentifier = columnIdentifier;
    e.as = as;

    e.nodeAlias = nodeAlias;
    e.fieldName = fieldName;

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
