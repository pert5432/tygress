import { Client } from "pg";
import { JoinStrategy, JoinType } from "./enums";
import { ComparisonFactory } from "./factories";
import { METADATA_STORE } from "./metadata";
import { EntitiesQueryRunner } from "./entities-query-runner";
import {
  ComparisonSqlBuilder,
  PseudoSQLReplacer,
  ParamBuilder,
  SelectSqlBuilder,
} from "./sql-builders";
import {
  AnEntity,
  Entity,
  Parametrizable,
  SelectQueryOrder,
  SelectQueryTarget,
  WhereComparator,
} from "./types";
import { NamedParams } from "./types/named-params";
import { Query } from "./types/query";
import { JoinArg } from "./types/query/join-arg";
import { ParameterArgs } from "./types/where-args";
import { RawQueryRunner } from "./raw-query-runner";
import { UnionToIntersection } from "./types/helpers";

type Extract<T> = T extends Array<infer I> | Promise<infer I> ? I : T;

type JoinImplArgs<I> = {
  strategy: JoinStrategy;

  target: I;

  select: boolean;

  type: JoinType;

  parentAlias?: string;
  parentField?: string;

  sql?: string;
  namedParams?: NamedParams;
};

type FlattenEntities<
  T extends { [key: string]: AnEntity },
  K = keyof T
> = K extends string
  ? {
      [F in keyof InstanceType<T[K]> as F extends string
        ? `${K}.${F}`
        : never]: InstanceType<T[K]>[F];
    }
  : never;

export class QueryBuilder<
  E extends AnEntity,
  JoinedEntities extends { [key: string]: E },
  SelectedEntities extends { [key: string]: E } = JoinedEntities,
  ExplicitSelects extends Record<string, any> = {}
> {
  private sourcesContext: JoinedEntities;

  private joins: JoinArg<AnEntity>[] = [];
  private wheres: ComparisonSqlBuilder[] = [];
  private selects: SelectQueryTarget[] = [];
  private orderBys: SelectQueryOrder[] = [];

  private _limit?: number;
  private _offset?: number;

  constructor(a: JoinedEntities) {
    this.sourcesContext = a;

    if (Object.keys(a).length !== 1) {
      throw new Error("Source entity object has to have exactly one key");
    }

    // Set the first join to be the root entity
    const alias = Object.keys(a)[0]!;
    this.joins = [{ alias, klass: a[alias]! }];
  }

  public log() {
    console.log(this.joins);
    console.log(this.wheres);
  }

  public where<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    rightAlias: K,
    rightField: F
  ): QueryBuilder<E, JoinedEntities, SelectedEntities, ExplicitSelects>;

  public where<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    alias: K,
    field: F,
    condition: ParameterArgs<Parametrizable>
  ): QueryBuilder<E, JoinedEntities, SelectedEntities, ExplicitSelects>;

  public where(
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<E, JoinedEntities, SelectedEntities, ExplicitSelects>;

  public where<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    leftAliasOrSql: K | string,
    leftFieldOrParams: F | NamedParams | undefined,
    conditionOrComparator?: ParameterArgs<Parametrizable> | WhereComparator,
    rightAlias?: K,
    rightField?: F
  ): QueryBuilder<E, JoinedEntities, SelectedEntities, ExplicitSelects> {
    // Adding a pseudo-sql condition
    if (["object", "undefined"].includes(typeof leftFieldOrParams)) {
      const targetSql = PseudoSQLReplacer.replaceIdentifiers(
        leftAliasOrSql as string,
        this.sourcesContext
      );

      this.wheres.push(
        ComparisonFactory.createSql(
          targetSql,
          (leftFieldOrParams ?? {}) as NamedParams
        )
      );

      return this;
    }

    // Adding a column cmp column condition
    if (typeof conditionOrComparator === "string") {
      const leftColumn = METADATA_STORE.getColumn(
        this.sourcesContext[leftAliasOrSql.toString()]!,
        leftFieldOrParams!.toString()
      );

      const rightColumn = METADATA_STORE.getColumn(
        this.sourcesContext[rightAlias!.toString()]!,
        rightField!.toString()
      );

      this.wheres.push(
        ComparisonFactory.createColCol({
          leftAlias: leftAliasOrSql.toString(),
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
      this.sourcesContext[leftAliasOrSql.toString()]!,
      leftAliasOrSql.toString()
    );

    this.wheres.push(
      ComparisonFactory.createFromCondition(
        leftAliasOrSql.toString(),
        column,
        conditionOrComparator!
      )
    );

    return this;
  }

  public select<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    A extends undefined
  >(
    alias: K,
    field: F,
    as?: A
  ): QueryBuilder<
    E,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects &
      (K extends string
        ? F extends string
          ? Record<`${K}.${F}`, InstanceType<JoinedEntities[K]>[F]>
          : {}
        : {})
  >;

  public select<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    A extends string
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<
    E,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<A, InstanceType<JoinedEntities[K]>[F]>
  >;

  public select<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    A extends string | undefined
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<
    E,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<string, InstanceType<JoinedEntities[K]>[F]>
  > {
    const klass = this.sourcesContext[alias];
    if (!klass) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    const column = METADATA_STORE.getColumn(klass, field.toString());

    this.selects.push({ alias: alias.toString(), column, as });

    return this as any;
  }

  public orderBy<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(alias: K, field: F, order: "ASC" | "DESC"): this {
    const klass = this.sourcesContext[alias];
    if (!klass) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    const column = METADATA_STORE.getColumn(klass, field.toString());

    this.orderBys.push({ alias: alias.toString(), column, order });

    return this;
  }

  public joinAndSelect<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    IE extends AnEntity,
    I extends { [key: string]: IE }
  >(
    target: I,
    parentAlias: K,
    parentField: F,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities & I>;

  public joinAndSelect<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    IE extends Entity<Extract<InstanceType<JoinedEntities[K]>[F]>>,
    I extends { [key: string]: IE }
  >(
    target: I,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities & I>;

  public joinAndSelect<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    IE extends AnEntity,
    I extends { [key: string]: IE }
  >(
    target: I,
    parentAlias: K,
    parentField: F,
    sql?: string,
    namedParams?: NamedParams
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities & I> {
    // Join either by sql or by relation based on args
    if (sql?.length) {
      this.joinImpl({
        strategy: JoinStrategy.SQL,
        type: JoinType.INNER,

        target,

        parentAlias: parentAlias as string,
        parentField: parentField as string,

        sql,
        namedParams,

        select: true,
      });
    } else {
      this.joinImpl({
        strategy: JoinStrategy.RELATION,
        type: JoinType.INNER,

        target,
        parentAlias: parentAlias as string,
        parentField: parentField as string,

        select: true,
      });
    }

    return this as any;
  }

  public join<IE extends AnEntity, I extends { [key: string]: IE }>(
    target: I,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities>;

  public join<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    IE extends Entity<Extract<InstanceType<JoinedEntities[K]>[F]>>,
    I extends { [key: string]: IE }
  >(
    target: I,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities>;

  public join<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>,
    IE extends Entity<Extract<InstanceType<JoinedEntities[K]>[F]>>,
    I extends { [key: string]: IE }
  >(
    target: I,
    parentAliasOrSql: K | string,
    optionalParentFieldOrNamedParams?: F | NamedParams
  ): QueryBuilder<E, JoinedEntities & I, SelectedEntities> {
    // Join either by sql or by relation based on args
    if (typeof optionalParentFieldOrNamedParams === "string") {
      this.joinImpl({
        strategy: JoinStrategy.RELATION,
        type: JoinType.INNER,

        target,
        parentAlias: parentAliasOrSql as string,
        parentField: optionalParentFieldOrNamedParams,
        select: false,
      });
    } else {
      this.joinImpl({
        strategy: JoinStrategy.SQL,
        type: JoinType.INNER,

        target,

        sql: parentAliasOrSql as string,
        namedParams: optionalParentFieldOrNamedParams as NamedParams,

        select: false,
      });
    }

    return this as any;
  }

  private joinImpl<I extends { [key: string]: AnEntity }>({
    type,
    select,
    strategy,
    target,
    parentAlias,
    parentField,
    sql,
    namedParams,
  }: JoinImplArgs<I>): this {
    if (Object.keys(target!).length !== 1) {
      throw new Error(`You need to join in exactly one entity at a time`);
    }

    const nextAlias = Object.keys(target!)[0]!;

    if (this.sourcesContext[nextAlias]) {
      throw new Error(`Entity with alias ${nextAlias} is already joined in`);
    }

    const nextEntity = target[nextAlias]!;

    switch (strategy) {
      case JoinStrategy.RELATION:
        this.joinViaRelation(
          parentAlias!,
          parentField!,
          nextAlias,
          nextEntity,
          select
        );
        break;

      case JoinStrategy.SQL:
        this.joinViaSql(
          nextAlias,
          nextEntity,
          sql!,
          select,
          parentAlias,
          parentField,
          namedParams
        );
    }

    return this;
  }

  private joinViaSql(
    nextAlias: string,
    nextEntity: AnEntity,
    sql: string,
    select: boolean,
    parentAlias?: string,
    parentField?: string,
    namedParams?: NamedParams
  ) {
    if (select && !(parentAlias?.length && parentField?.length)) {
      throw new Error(
        `SQL join needs parent alias and parent field with select set to true`
      );
    }

    // Add the join we are currently creating to the contexts so it can be referenced in the sql
    const targetSql = PseudoSQLReplacer.replaceIdentifiers(sql, {
      ...this.sourcesContext,
      [nextAlias]: nextEntity,
    });

    const comparison = ComparisonFactory.createSql(
      targetSql,
      namedParams ?? {}
    );

    this.joins.push({
      alias: nextAlias,
      klass: nextEntity,
      comparison,
      select,

      parentAlias,
      parentField,
    });
  }

  private joinViaRelation(
    parentAlias: string,
    parentField: string,
    nextAlias: string,
    nextEntity: AnEntity,
    select: boolean
  ) {
    const parentEntity = this.sourcesContext[parentAlias];

    if (!parentEntity) {
      throw new Error(
        `No entity with alias ${parentAlias.toString()} found in query`
      );
    }

    this.sourcesContext = {
      ...this.sourcesContext,
      ...{ [nextAlias]: nextEntity },
    };

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
      klass: nextEntity,
      parentAlias: parentAlias.toString(),
      parentField: parentField.toString(),
      comparison: comparison,
      select,
    });
  }

  public limit(val: number): this {
    this._limit = val;

    return this;
  }

  public removeLimit(): this {
    this._limit = undefined;

    return this;
  }

  public offset(val: number): this {
    this._offset = val;

    return this;
  }

  public removeOffset(): this {
    this._offset = undefined;

    return this;
  }

  public unselectAll(): this {
    this.selects = [];

    return this;
  }

  public removeOrderBys(): this {
    this.orderBys = [];

    return this;
  }

  public getQuery(): Query {
    const paramBuilder = new ParamBuilder();

    return new SelectSqlBuilder<E>(
      {
        joins: this.joins,
        wheres: this.wheres,
        selects: this.selects,
        orderBys: this.orderBys,

        limit: this._limit,
        offset: this._offset,
      },
      paramBuilder
    ).buildSelect();
  }

  public async getEntities(client: Client): Promise<InstanceType<E>[]> {
    return new EntitiesQueryRunner<E>(client, this.getQuery()).run();
  }

  public async getRaw(
    client: Client
  ): Promise<
    keyof ExplicitSelects extends never
      ? UnionToIntersection<FlattenEntities<SelectedEntities>>[]
      : ExplicitSelects[]
  > {
    return RawQueryRunner.run(client, this.getQuery()) as any;
  }
}
