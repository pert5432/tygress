import {
  ComparisonSqlBuilder,
  TableIdentifierSqlBuilder,
} from "../sql-builders";
import { AnEntity } from "../types";
import { JoinArg } from "../types/query/join-arg";

export abstract class JoinArgFactory {
  public static create<T extends AnEntity>(
    parentAlias: string,
    parentField: string,
    entity: T,
    alias: string,
    identifier: TableIdentifierSqlBuilder,
    comparison: ComparisonSqlBuilder
  ): JoinArg {
    const e = new JoinArg();

    e.klass = entity;
    e.alias = alias;
    e.identifier = identifier;

    e.parentAlias = parentAlias;
    e.parentField = parentField;

    e.comparison = comparison;

    return e;
  }

  public static createRoot<T extends AnEntity>(
    entity: T,
    alias: string,
    identifier: TableIdentifierSqlBuilder
  ): JoinArg {
    const e = new JoinArg();

    e.klass = entity;
    e.alias = alias;
    e.identifier = identifier;

    return e;
  }
}
