import { TableIdentifierSqlBuilder } from "../sql-builders";
import { AnEntity, ClassArg } from "../types";
import { JoinArg } from "../types/query/join-arg";

export abstract class JoinArgFactory {
  public static create({
    klass,
    alias,
    type,
    childType,
    identifier,
    comparison,
    parentAlias,
    parentField,
    select,
  }: ClassArg<JoinArg>): JoinArg {
    const e = new JoinArg();

    e.klass = klass!;
    e.alias = alias;
    e.type = type;
    e.childType = childType;
    e.identifier = identifier;
    e.comparison = comparison;
    e.parentAlias = parentAlias;
    e.parentField = parentField;
    e.select = select;

    return e;
  }

  public static createRoot(
    entity: AnEntity,
    alias: string,
    identifier: TableIdentifierSqlBuilder,
    childType: "entity" | "cte"
  ): JoinArg {
    const e = new JoinArg();

    e.klass = entity;
    e.alias = alias;
    e.identifier = identifier;

    e.childType = childType;

    return e;
  }
}
