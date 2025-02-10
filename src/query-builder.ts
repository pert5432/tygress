import { Client } from "pg";
import { JoinStrategy, JoinType } from "./enums";
import { ComparisonFactory, SelectTargetSqlBuilderFactory } from "./factories";
import { METADATA_STORE } from "./metadata";
import { EntitiesQueryRunner } from "./entities-query-runner";
import {
  ComparisonSqlBuilder,
  PseudoSQLReplacer,
  ParamBuilder,
  SelectSqlBuilder,
  SelectTargetSqlBuilder,
} from "./sql-builders";
import {
  AnEntity,
  Parametrizable,
  SelectQueryOrder,
  WhereComparator,
} from "./types";
import { NamedParams } from "./types/named-params";
import { Query } from "./types/query";
import { JoinArg } from "./types/query/join-arg";
import { ParameterArgs } from "./types/where-args";
import { RawQueryRunner } from "./raw-query-runner";
import { UnionToIntersection } from "./types/helpers";

type JoinImplArgs<I> = {
  strategy: JoinStrategy;

  targetAlias: string;
  targetEntity: AnEntity;

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
  RootEntity extends AnEntity,
  JoinedEntities extends Record<string, AnEntity>,
  SelectedEntities extends Record<string, AnEntity> = JoinedEntities,
  ExplicitSelects extends Record<string, any> = {}
> {
  private sourcesContext: JoinedEntities;

  private joins: JoinArg<AnEntity>[] = [];
  private wheres: ComparisonSqlBuilder[] = [];
  private selects: SelectTargetSqlBuilder[] = [];
  private orderBys: SelectQueryOrder[] = [];

  private _limit?: number;
  private _offset?: number;

  constructor(alias: string, entity: AnEntity) {
    this.sourcesContext = { [alias]: entity } as any;

    // Set the first join to be the root entity
    this.joins = [{ alias, klass: entity }];
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
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects
  >;

  public where<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    alias: K,
    field: F,
    condition: ParameterArgs<Parametrizable>
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects
  >;

  public where(
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects
  >;

  public where<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    leftAliasOrSql: K | string,
    leftFieldOrParams: F | NamedParams | undefined,
    conditionOrComparator?: ParameterArgs<Parametrizable> | WhereComparator,
    rightAlias?: K,
    rightField?: F
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects
  > {
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

  public selectRaw<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    f: () => T,
    params?: NamedParams
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects &
      Record<
        Alias,
        T extends abstract new (...args: any) => any ? InstanceType<T> : T
      >
  >;

  public selectRaw<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    params?: NamedParams
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<Alias, T>
  >;

  public selectRaw<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    fOrParams?: () => T | NamedParams,
    _f?: () => T
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<Alias, T>
  > {
    const params = fOrParams && Object.keys(fOrParams).length ? fOrParams : {};

    this.selects.push(
      SelectTargetSqlBuilderFactory.createSql(
        PseudoSQLReplacer.replaceIdentifiers(sql, this.sourcesContext),
        as,
        params
      )
    );

    return this as any;
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
    RootEntity,
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
    F extends "*",
    A extends undefined
  >(
    alias: K,
    field: F,
    as?: A
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects &
      (K extends string ? FlattenEntities<Record<K, JoinedEntities[K]>> : {})
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
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<A, InstanceType<JoinedEntities[K]>[F]>
  >;

  public select<
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]> | "*",
    A extends string | undefined
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    ExplicitSelects & Record<string, InstanceType<JoinedEntities[K]>[F]>
  > {
    const klass = this.sourcesContext[alias];
    if (!klass) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    // Select one or all columns from the entity based on field arg
    const columns =
      field === "*"
        ? METADATA_STORE.getTable(klass).columns
        : [METADATA_STORE.getColumn(klass, field.toString())];

    for (const column of columns) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createColumn(alias.toString(), column, as)
      );
    }

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
    A extends string,
    E extends AnEntity,
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<
    RootEntity,
    JoinedEntities & Record<A, E>,
    SelectedEntities & Record<A, E>
  >;

  public joinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<
    RootEntity,
    JoinedEntities & Record<A, E>,
    SelectedEntities & Record<A, E>
  >;

  public joinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F,
    sql?: string,
    namedParams?: NamedParams
  ): QueryBuilder<
    RootEntity,
    JoinedEntities & Record<A, E>,
    SelectedEntities & Record<A, E>
  > {
    // Join either by sql or by relation based on args
    if (sql?.length) {
      this.joinImpl({
        strategy: JoinStrategy.SQL,
        type: JoinType.INNER,

        targetAlias,
        targetEntity,

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

        targetAlias,
        targetEntity,
        parentAlias: parentAlias as string,
        parentField: parentField as string,

        select: true,
      });
    }

    return this as any;
  }

  public join<
    A extends string,
    E extends AnEntity,
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<RootEntity, JoinedEntities & Record<A, E>, SelectedEntities>;

  public join<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<RootEntity, JoinedEntities & Record<A, E>, SelectedEntities>;

  public join<
    A extends string,
    E extends AnEntity,
    K extends keyof JoinedEntities,
    F extends keyof InstanceType<JoinedEntities[K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAliasOrSql: K | string,
    optionalParentFieldOrNamedParams?: F | NamedParams
  ): QueryBuilder<RootEntity, JoinedEntities & Record<A, E>, SelectedEntities> {
    // Join either by sql or by relation based on args
    if (typeof optionalParentFieldOrNamedParams === "string") {
      this.joinImpl({
        strategy: JoinStrategy.RELATION,
        type: JoinType.INNER,

        targetAlias,
        targetEntity,
        parentAlias: parentAliasOrSql as string,
        parentField: optionalParentFieldOrNamedParams,
        select: false,
      });
    } else {
      this.joinImpl({
        strategy: JoinStrategy.SQL,
        type: JoinType.INNER,

        targetAlias,
        targetEntity,

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
    targetAlias,
    targetEntity,
    parentAlias,
    parentField,
    sql,
    namedParams,
  }: JoinImplArgs<I>): void {
    if (this.sourcesContext[targetAlias]) {
      throw new Error(`Entity with alias ${targetAlias} is already joined in`);
    }

    switch (strategy) {
      case JoinStrategy.RELATION:
        this.joinViaRelation(
          parentAlias!,
          parentField!,
          targetAlias,
          targetEntity,
          select
        );
        break;

      case JoinStrategy.SQL:
        this.joinViaSql(
          targetAlias,
          targetEntity,
          sql!,
          select,
          parentAlias,
          parentField,
          namedParams
        );
    }
  }

  private joinViaSql(
    nextAlias: string,
    nextEntity: AnEntity,
    sql: string,
    select: boolean,
    parentAlias?: string,
    parentField?: string,
    namedParams?: NamedParams
  ): void {
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
  ): void {
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

  public unselectAll(): QueryBuilder<
    RootEntity,
    JoinedEntities,
    SelectedEntities,
    {}
  > {
    this.selects = [];

    return this;
  }

  public removeOrderBys(): this {
    this.orderBys = [];

    return this;
  }

  public getQuery(): Query {
    const paramBuilder = new ParamBuilder();

    return new SelectSqlBuilder<RootEntity>(
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

  public async getEntities(
    client: Client
  ): Promise<InstanceType<RootEntity>[]> {
    return new EntitiesQueryRunner<RootEntity>(client, this.getQuery()).run();
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
