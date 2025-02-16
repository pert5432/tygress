import { Client } from "pg";
import { JoinStrategy, JoinType, QueryResultType } from "./enums";
import {
  ColumnIdentifierSqlBuilderFactory,
  ComparisonFactory,
  SelectTargetSqlBuilderFactory,
  TableIdentifierSqlBuilderFactory,
} from "./factories";
import { METADATA_STORE } from "./metadata";
import { EntitiesQueryRunner } from "./entities-query-runner";
import {
  ComparisonSqlBuilder,
  PseudoSQLReplacer,
  ParamBuilder,
  SelectSqlBuilder,
  SelectTargetSqlBuilder,
  ColumnIdentifierSqlBuilder,
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
import { CteTableIdentifierSqlBuilder } from "./sql-builders/table-identifier";
import {
  QueryBuilderGenerics,
  SelectSource,
  SelectSourceField,
  SelectSourceKeys,
  Stringify,
  Update,
} from "./types/query-builder";

type JoinImplArgs = {
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

type FlattenSelectSources<
  T extends { [key: string]: SelectSource },
  K = keyof T
> = K extends string
  ? {
      [F in SelectSourceKeys<T[K]> as F extends string
        ? `${K}.${F}`
        : never]: SelectSourceField<T[K], Stringify<F>>;
    }
  : never;

export class QueryBuilder<G extends QueryBuilderGenerics> {
  private sourcesContext: G["JoinedEntities"];

  private joins: JoinArg<AnEntity>[] = [];
  private wheres: ComparisonSqlBuilder[] = [];
  private selects: SelectTargetSqlBuilder[] = [];
  private orderBys: SelectQueryOrder[] = [];
  private groupBys: ColumnIdentifierSqlBuilder[] = [];
  private CTEs: CteTableIdentifierSqlBuilder[] = [];

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

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: QueryBuilder<{
      RootEntity: any;
      JoinedEntities: any;
      CTEs: any;
      SelectedEntities: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<Update<G, "CTEs", G["CTEs"] & Record<A, T>>> {
    if (this.sourcesContext[alias]) {
      throw new Error(`Entity with alias ${alias} already exists`);
    }

    this.CTEs.push(TableIdentifierSqlBuilderFactory.createCTE(alias, qb));

    return this as any;
  }

  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    K2 extends keyof G["JoinedEntities"],
    F2 extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    rightAlias: K2,
    rightField: F2
  ): QueryBuilder<G>;

  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    alias: K,
    field: F,
    condition: ParameterArgs<Parametrizable>
  ): QueryBuilder<G>;

  public where(sql: string, namedParams?: NamedParams): QueryBuilder<G>;

  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAliasOrSql: K | string,
    leftFieldOrParams: F | NamedParams | undefined,
    conditionOrComparator?: ParameterArgs<Parametrizable> | WhereComparator,
    rightAlias?: K,
    rightField?: F
  ): QueryBuilder<G> {
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
        this.sourcesContext[leftAliasOrSql.toString()]! as AnEntity,
        leftFieldOrParams!.toString()
      );

      const rightColumn = METADATA_STORE.getColumn(
        this.sourcesContext[rightAlias!.toString()]! as AnEntity,
        rightField!.toString()
      );

      this.wheres.push(
        ComparisonFactory.createColCol(
          leftAliasOrSql.toString(),
          leftColumn,
          conditionOrComparator,
          rightAlias!.toString(),
          rightColumn
        )
      );

      return this;
    }

    // Adding a column cmp params condition
    const column = METADATA_STORE.getColumn(
      this.sourcesContext[leftAliasOrSql.toString()]! as AnEntity,
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
    Update<
      G,
      "ExplicitSelects",
      G["ExplicitSelects"] &
        Record<
          Alias,
          T extends abstract new (...args: any) => any ? InstanceType<T> : T
        >
    >
  >;

  public selectRaw<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    params?: NamedParams
  ): QueryBuilder<Update<G, "ExplicitSelects", Record<Alias, T>>>;

  public selectRaw<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    fOrParams?: () => T | NamedParams,
    _f?: () => T
  ): QueryBuilder<Update<G, "ExplicitSelects", Record<Alias, T>>> {
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
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    A extends undefined
  >(
    alias: K,
    field: F,
    as?: A
  ): QueryBuilder<
    Update<
      G,
      "ExplicitSelects",
      G["ExplicitSelects"] &
        (K extends string
          ? F extends string
            ? Record<`${K}.${F}`, SelectSourceField<G["JoinedEntities"][K], F>>
            : {}
          : {})
    >
  >;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    A extends string
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<
    Update<
      G,
      "ExplicitSelects",
      G["ExplicitSelects"] &
        Record<A, SelectSourceField<G["JoinedEntities"][K], Stringify<F>>>
    >
  >;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends "*",
    A extends undefined
  >(
    alias: K,
    field: F,
    as?: A
  ): QueryBuilder<
    Update<
      G,
      "ExplicitSelects",
      G["ExplicitSelects"] &
        (K extends string
          ? FlattenSelectSources<Record<K, G["JoinedEntities"][K]>>
          : {})
    >
  >;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]> | "*",
    A extends string | undefined
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<
    Update<
      G,
      "ExplicitSelects",
      Record<string, SelectSourceField<G["JoinedEntities"][K], Stringify<F>>>
    >
  > {
    const klass = this.sourcesContext[alias];
    if (!klass) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    // Select one or all columns from the entity based on field arg
    const columns =
      field === "*"
        ? METADATA_STORE.getTable(klass as AnEntity).columns
        : [METADATA_STORE.getColumn(klass as AnEntity, field.toString())];

    for (const column of columns) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createColumn(alias.toString(), column, as)
      );
    }

    return this as any;
  }

  public orderBy<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F, order: "ASC" | "DESC"): this {
    const klass = this.sourcesContext[alias];
    if (!klass) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    const column = METADATA_STORE.getColumn(
      klass as AnEntity,
      field.toString()
    );

    this.orderBys.push({ alias: alias.toString(), column, order });

    return this;
  }

  public joinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"] & Record<A, E>;
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public joinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"] & Record<A, E>;
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public joinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F,
    sql?: string,
    namedParams?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"] & Record<A, E>;
    ExplicitSelects: G["ExplicitSelects"];
  }> {
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
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<
    Update<G, "JoinedEntities", G["JoinedEntities"] & Record<A, E>>
  >;

  public join<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    sql: string,
    namedParams?: NamedParams
  ): QueryBuilder<
    Update<G, "JoinedEntities", G["JoinedEntities"] & Record<A, E>>
  >;

  public join<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntity: E,
    parentAliasOrSql: K | string,
    optionalParentFieldOrNamedParams?: F | NamedParams
  ): QueryBuilder<
    Update<G, "JoinedEntities", G["JoinedEntities"] & Record<A, E>>
  > {
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

  public groupBy<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F): this {
    const entity = this.sourcesContext[alias];
    if (!entity) {
      throw new Error(`No entity found with alias ${alias.toString()}`);
    }

    const table = METADATA_STORE.getTable_(entity as AnEntity);
    const column = table?.columnsMap.get(field.toString());

    if (column) {
      this.groupBys.push(
        ColumnIdentifierSqlBuilderFactory.createColumnMeta(
          alias.toString(),
          column
        )
      );
    } else {
      this.groupBys.push(
        ColumnIdentifierSqlBuilderFactory.createColumnName(
          alias.toString(),
          field.toString()
        )
      );
    }

    return this;
  }

  private joinImpl({
    type,
    select,
    strategy,
    targetAlias,
    targetEntity,
    parentAlias,
    parentField,
    sql,
    namedParams,
  }: JoinImplArgs): void {
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
      parentEntity as AnEntity,
      parentField.toString()
    );

    const comparison = ComparisonFactory.createJoin(
      parentAlias.toString(),
      parentEntity as AnEntity,
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

  public unselectAll(): QueryBuilder<Update<G, "ExplicitSelects", {}>> {
    this.selects = [];

    return this;
  }

  public removeOrderBys(): this {
    this.orderBys = [];

    return this;
  }

  public getQuery(
    resultType: QueryResultType,
    _paramBuilder?: ParamBuilder
  ): Query {
    const paramBuilder = _paramBuilder ?? new ParamBuilder();

    return new SelectSqlBuilder<G["RootEntity"]>(
      {
        resultType,
        joins: this.joins,
        wheres: this.wheres,
        selects: this.selects,
        orderBys: this.orderBys,
        groupBys: this.groupBys,

        with: this.CTEs,

        limit: this._limit,
        offset: this._offset,
      },
      paramBuilder
    ).buildSelect();
  }

  public async getEntities(
    client: Client
  ): Promise<InstanceType<G["RootEntity"]>[]> {
    return new EntitiesQueryRunner<G["RootEntity"]>(
      client,
      this.getQuery(QueryResultType.ENTITIES)
    ).run();
  }

  public async getRaw(
    client: Client
  ): Promise<
    keyof G["ExplicitSelects"] extends never
      ? UnionToIntersection<FlattenSelectSources<G["SelectedEntities"]>>[]
      : G["ExplicitSelects"][]
  > {
    return RawQueryRunner.run(
      client,
      this.getQuery(QueryResultType.RAW)
    ) as any;
  }
}
