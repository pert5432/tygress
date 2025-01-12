import { ComparisonSqlBuilder } from "../sql-builders";
import { AnEntity } from "../types";
import { JoinArg } from "../types/query/join-arg";

export abstract class JoinArgFactory {
  public static create<T extends AnEntity>(
    parentAlias: string,
    parentField: string,
    entity: T,
    alias: string,
    comparison: ComparisonSqlBuilder
  ): JoinArg<T> {
    const e = new JoinArg<T>();

    e.klass = entity;
    e.alias = alias;

    e.parentAlias = parentAlias;
    e.parentField = parentField;

    e.comparison = comparison;

    return e;
  }

  public static createRoot<T extends AnEntity>(
    entity: T,
    alias: string
  ): JoinArg<T> {
    const e = new JoinArg<T>();

    e.klass = entity;
    e.alias = alias;

    return e;
  }
}
