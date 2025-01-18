import { ComparisonFactory } from "./factories";
import { METADATA_STORE } from "./metadata";
import {
  ComparisonSqlBuilder,
  ParamBuilder,
  SelectSqlBuilder,
} from "./sql-builders";
import { AnEntity, Entity, Parametrizable, WhereComparator } from "./types";
import { Query } from "./types/query";
import { JoinArg } from "./types/query/join-arg";
import { ParameterArgs } from "./types/where-args";

type Extract<T> = T extends Array<infer I> | Promise<infer I> ? I : T;

export class QueryBuilder<E extends AnEntity, T extends { [key: string]: E }> {
  private sourcesContext: T;

  private joins: JoinArg<AnEntity>[] = [];
  private wheres: ComparisonSqlBuilder[] = [];

  constructor(a: T) {
    this.sourcesContext = a;

    // Set the first join to be the root entity
    const alias = Object.keys(a)[0]!;
    this.joins = [{ alias, klass: a[alias]! }];
  }

  public log() {
    console.log(this.joins);
    console.log(this.wheres);
  }

  public where<K extends keyof T, F extends keyof InstanceType<T[K]>>(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    rightAlias: K,
    rightField: F
  ): QueryBuilder<E, T>;

  public where<K extends keyof T, F extends keyof InstanceType<T[K]>>(
    alias: K,
    field: F,
    condition: ParameterArgs<Parametrizable>
  ): QueryBuilder<E, T>;

  public where<K extends keyof T, F extends keyof InstanceType<T[K]>>(
    leftAlias: K,
    leftField: F,
    conditionOrComparator: ParameterArgs<Parametrizable> | WhereComparator,
    rightAlias?: K,
    rightField?: F
  ): QueryBuilder<E, T> {
    // Adding a column cmp column condition
    if (typeof conditionOrComparator === "string") {
      const leftColumn = METADATA_STORE.getColumn(
        this.sourcesContext[leftAlias.toString()]!,
        leftField.toString()
      );

      const rightColumn = METADATA_STORE.getColumn(
        this.sourcesContext[rightAlias!.toString()]!,
        rightField!.toString()
      );

      this.wheres.push(
        ComparisonFactory.createColCol({
          leftAlias: leftAlias.toString(),
          leftColumn: leftColumn.name,
          comparator: conditionOrComparator,
          rightAlias: rightAlias!.toString(),
          rightColumn: rightColumn.name,
        })
      );

      return this;
    }

    // Adding a column cmp params condition
    const column = METADATA_STORE.getColumn(
      this.sourcesContext[leftAlias.toString()]!,
      leftField.toString()
    );

    this.wheres.push(
      ComparisonFactory.createFromCondition(
        leftAlias.toString(),
        column,
        conditionOrComparator
      )
    );

    return this;
  }

  public join<
    K extends keyof T,
    F extends keyof InstanceType<T[K]>,
    IE extends Entity<Extract<InstanceType<T[K]>[F]>>,
    I extends { [key: string]: IE }
  >(parentAlias: K, parentField: F, target: I): QueryBuilder<E, T & I> {
    if (Object.keys(target).length !== 1) {
      throw new Error(`You need to join in exactly one entity at a time`);
    }

    const nextAlias = Object.keys(target)[0]!;

    if (this.sourcesContext[nextAlias]) {
      throw new Error(`Entity with alias ${nextAlias} is already joined in`);
    }

    const parentEntity = this.sourcesContext[parentAlias];

    if (!parentEntity) {
      throw new Error(
        `No entity with alias ${parentAlias.toString()} found in query`
      );
    }

    this.sourcesContext = { ...this.sourcesContext, ...target };

    const relation = METADATA_STORE.getRelation(
      parentEntity,
      parentField.toString()
    );

    const comparison = ComparisonFactory.createJoin(
      parentAlias.toString(),
      parentEntity,
      nextAlias,
      relation
    );

    this.joins.push({
      alias: nextAlias,
      klass: target[nextAlias]!,
      parentAlias: parentAlias.toString(),
      parentField: parentField.toString(),
      comparison: comparison,
    });

    return this as any;
  }

  public getQuery(): Query<E> {
    const paramBuilder = new ParamBuilder();

    return new SelectSqlBuilder<E>(
      { joins: this.joins, wheres: this.wheres, selects: [], orderBys: [] },
      paramBuilder
    ).buildSelect();
  }
}
