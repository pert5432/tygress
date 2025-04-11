import { METADATA_STORE } from "../metadata";
import { QueryBuilder } from "../query-builder";
import {
  CteTableIdentifierSqlBuilder,
  DmlTableIdentifierSqlBuilder,
  SubQueryTableIdentifierSqlBuilder,
  TableIdentifierSqlBuilder,
  TablenameTableIdentifierSqlBuilder,
} from "../sql-builders/table-identifier";
import { AnEntity } from "../types";
import { SelectSourceContext } from "../types/query-builder";

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
    qb: QueryBuilder<any>,
    alias?: string,
    columnList?: string[]
  ): SubQueryTableIdentifierSqlBuilder {
    const e = new SubQueryTableIdentifierSqlBuilder();

    e.qb = qb;
    e.alias = alias;
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

  static createEntity(
    alias: string,
    entity: AnEntity
  ): TablenameTableIdentifierSqlBuilder {
    const e = new TablenameTableIdentifierSqlBuilder();

    const entityMeta = METADATA_STORE.getTable(entity);

    e.alias = alias;
    e.tablename = entityMeta.tablename;

    return e;
  }

  static createSelectSourceContext(
    alias: string,
    source: SelectSourceContext
  ): TableIdentifierSqlBuilder {
    switch (source.type) {
      case "entity":
        return this.createEntity(alias, source.source);
      case "cte":
        // Use the CTEs name as an alias
        return this.createTablename(alias, source.name);
    }
  }

  static createDML(tablename: string): DmlTableIdentifierSqlBuilder {
    const e = new DmlTableIdentifierSqlBuilder();

    e.tablename = tablename;

    return e;
  }
}
