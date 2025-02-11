import { QueryBuilder } from "../query-builder";
import {
  CteTableIdentifierSqlBuilder,
  SubQueryTableIdentifierSqlBuilder,
  TablenameTableIdentifierSqlBuilder,
} from "../sql-builders/table-identifier";

export abstract class TableIdentifierSqlBuilderFactory {
  static createCTE(
    alias: string,
    qb: QueryBuilder<any>,
    columnList?: string[]
  ): CteTableIdentifierSqlBuilder {
    const e = new CteTableIdentifierSqlBuilder();

    e.alias = alias;
    e.qb = qb;
    e.columnList = columnList;

    return e;
  }

  static createSubQuery(
    alias: string,
    qb: QueryBuilder<any>,
    columnList?: string[]
  ): SubQueryTableIdentifierSqlBuilder {
    const e = new SubQueryTableIdentifierSqlBuilder();

    e.alias = alias;
    e.qb = qb;
    e.columnList = columnList;

    return e;
  }

  static createTablename(
    alias: string,
    tablename: string
  ): TablenameTableIdentifierSqlBuilder {
    const e = new TablenameTableIdentifierSqlBuilder();

    e.alias = alias;
    e.tablename = tablename;

    return e;
  }
}
