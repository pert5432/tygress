import { JoinStrategy, JoinType, QueryResultType } from "./enums";
import {
  ColumnIdentifierSqlBuilderFactory,
  ComparisonFactory,
  OrderByExpressionSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TableIdentifierSqlBuilderFactory,
} from "./factories";
import { METADATA_STORE } from "./metadata";
import { QueryResultEntitiesParser } from "./entities-query-result-parser";
import {
  ComparisonSqlBuilder,
  PseudoSQLReplacer,
  ParamBuilder,
  SelectSqlBuilder,
  SelectTargetSqlBuilder,
  ColumnIdentifierSqlBuilder,
} from "./sql-builders";
import { AnEntity, Parametrizable, WhereComparator } from "./types";
import { NamedParams } from "./types/named-params";
import { JoinArg } from "./types/query/join-arg";
import { ParameterArgs } from "./types/where-args";
import { RawQueryResultParser } from "./raw-query-result-parser";
import { UnionToIntersection } from "./types/helpers";
import {
  CteTableIdentifierSqlBuilder,
  TableIdentifierSqlBuilder,
} from "./sql-builders/table-identifier";
import {
  QueryBuilderGenerics,
  SelectSource,
  SelectSourceField,
  SelectSourceKeys,
  SourcesContext,
  Stringify,
  Update,
} from "./types/query-builder";
import { OrderByExpressionSqlBuilder } from "./sql-builders/order-by-expression";
import { QueryBuilderFactory } from "./query-builder-factory";
import { PostgresClient } from "./postgres-client";
import { Query } from "./types/query";
import { QueryRunner } from "./query-runner";

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
  private client: PostgresClient;

  private sourcesContext: SourcesContext<G>;

  private joins: JoinArg[] = [];
  private wheres: ComparisonSqlBuilder[] = [];
  private selects: SelectTargetSqlBuilder[] = [];
  private orderBys: OrderByExpressionSqlBuilder[] = [];
  private groupBys: ColumnIdentifierSqlBuilder[] = [];
  private CTEs: CteTableIdentifierSqlBuilder[] = [];

  private _limit?: number;
  private _offset?: number;

  private paramBuilder: ParamBuilder;

  constructor(
    client: PostgresClient,
    alias: string,
    entity: AnEntity,
    type: "entity" | "cte",
    sourcesContext: SourcesContext<G>,
    paramBuilder?: ParamBuilder
  ) {
    this.client = client;

    this.sourcesContext = sourcesContext;

    // Set the first join to be the root entity
    this.joins = [
      {
        alias,
        klass: entity,
        type,
        identifier: TableIdentifierSqlBuilderFactory.createSelectSourceContext(
          alias,
          {
            type,
            source: entity,
          }
        ),
      },
    ];

    this.paramBuilder = paramBuilder ?? new ParamBuilder();
  }

  private addSource(
    alias: string,
    source: SelectSource,
    type: "entity" | "cte"
  ): void {
    if (this.sourcesContext[alias]) {
      throw new Error(`Select source with alias ${alias} already exists`);
    }

    this.sourcesContext = {
      ...this.sourcesContext,
      ...{ [alias]: { source, type } },
    };
  }

  private getSource(alias: string) {
    const source = this.sourcesContext[alias];

    if (!source) {
      throw new Error(`No select source found with alias ${alias}`);
    }

    return source;
  }

  private getColumnIdentifier(
    alias: string,
    fieldName: string
  ): ColumnIdentifierSqlBuilder {
    const source = this.sourcesContext[alias];
    if (!source) {
      throw new Error(`No select source found with alias ${alias}`);
    }

    switch (source.type) {
      case "entity":
        const column = METADATA_STORE.getColumn(source.source, fieldName);
        return ColumnIdentifierSqlBuilderFactory.createColumnMeta(
          alias,
          column
        );
      case "cte":
        return ColumnIdentifierSqlBuilderFactory.createColumnName(
          alias,
          fieldName
        );
    }
  }

  private childQbFactory(): QueryBuilderFactory<G> {
    return new QueryBuilderFactory<G>({
      client: this.client,
      sourcesContext: this.sourcesContext,
      paramBuilder: this.paramBuilder,
    });
  }

  public log() {
    console.log(this.joins);
    console.log(this.wheres);
  }

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: (qb: QueryBuilderFactory<G>) => QueryBuilder<{
      RootEntity: any;
      JoinedEntities: any;
      CTEs: any;
      SelectedEntities: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<Update<G, "CTEs", G["CTEs"] & Record<A, T>>>;

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: QueryBuilder<{
      RootEntity: any;
      JoinedEntities: any;
      CTEs: any;
      SelectedEntities: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<Update<G, "CTEs", G["CTEs"] & Record<A, T>>>;

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb:
      | QueryBuilder<{
          RootEntity: any;
          JoinedEntities: any;
          CTEs: any;
          SelectedEntities: any;
          ExplicitSelects: T;
        }>
      | ((qb: QueryBuilderFactory<G>) => QueryBuilder<{
          RootEntity: any;
          JoinedEntities: any;
          CTEs: any;
          SelectedEntities: any;
          ExplicitSelects: T;
        }>)
  ): QueryBuilder<Update<G, "CTEs", G["CTEs"] & Record<A, T>>> {
    this.addSource(alias, Object, "cte");

    const resultQb =
      qb instanceof QueryBuilder ? qb : qb(this.childQbFactory());

    this.CTEs.push(TableIdentifierSqlBuilderFactory.createCTE(alias, resultQb));

    return this as any;
  }

  public whereIn<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAlias: K,
    leftField: F,
    subQuery: (qb: QueryBuilderFactory<G>) => QueryBuilder<any>
  ): QueryBuilder<G> {
    const left = this.getColumnIdentifier(
      leftAlias.toString(),
      leftField.toString()
    );

    const resultQb = subQuery(this.childQbFactory());

    const subQueryIdentifier =
      TableIdentifierSqlBuilderFactory.createSubQuery(resultQb);

    this.wheres.push(
      ComparisonFactory.colTableIdentifier(left, "IN", subQueryIdentifier)
    );

    return this;
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
      const left = this.getColumnIdentifier(
        leftAliasOrSql.toString(),
        leftFieldOrParams!.toString()
      );

      const right = this.getColumnIdentifier(
        rightAlias!.toString(),
        rightField!.toString()
      );

      this.wheres.push(
        ComparisonFactory.createColColIdentifiers(
          left,
          conditionOrComparator,
          right
        )
      );

      return this;
    }

    const columnIdentifier = this.getColumnIdentifier(
      leftAliasOrSql.toString(),
      leftFieldOrParams!.toString()
    );

    this.wheres.push(
      ComparisonFactory.createFromConditionIdentifier(
        columnIdentifier,
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
    const source = this.getSource(alias.toString());
    const klass = source.source;

    if (field === "*" && source.type !== "entity") {
      throw new Error(`Can't select * on other select sources than entity`);
    }

    // TODO: this won't work for CTEs because they don't have an entity
    // TODO: proposed solution is to extract the SelectTargetSqlBuilders from the CTEs query builder and use them here
    // TODO: not sure how exactly to do it at this point, making the select targets a public attribute seems kinda unlucky
    const fieldNames: string[] =
      field === "*"
        ? METADATA_STORE.getTable(klass as AnEntity).columns.map(
            (e) => e.fieldName
          )
        : [field.toString()];

    const columnIdentifiers = fieldNames.map((f) => ({
      fieldName: f,
      identifier: this.getColumnIdentifier(alias.toString(), f),
    }));

    for (const { identifier, fieldName } of columnIdentifiers) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createColumnIdentifier(
          identifier,
          as ?? `${alias.toString()}.${fieldName}`,
          alias.toString(),
          fieldName
        )
      );
    }

    return this as any;
  }

  public orderBy<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F, order?: "ASC" | "DESC"): this {
    const identifier = this.getColumnIdentifier(
      alias.toString(),
      field.toString()
    );

    this.orderBys.push(
      OrderByExpressionSqlBuilderFactory.create(identifier, order)
    );

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
    this.groupBys.push(
      this.getColumnIdentifier(alias.toString(), field.toString())
    );

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

    this.addSource(nextAlias, nextEntity, "entity");

    // Add the join we are currently creating to the contexts so it can be referenced in the sql
    const targetSql = PseudoSQLReplacer.replaceIdentifiers(
      sql,
      this.sourcesContext
    );

    const comparison = ComparisonFactory.createSql(
      targetSql,
      namedParams ?? {}
    );

    this.joins.push({
      alias: nextAlias,
      klass: nextEntity,
      identifier: TableIdentifierSqlBuilderFactory.createEntity(
        nextAlias,
        nextEntity
      ),

      comparison,
      select,

      parentAlias,
      parentField,

      type: "entity",
    });
  }

  private joinViaRelation(
    parentAlias: string,
    parentField: string,
    nextAlias: string,
    nextEntity: AnEntity,
    select: boolean
  ): void {
    const source = this.sourcesContext[parentAlias];
    if (!source) {
      throw new Error(`No select source found with alias ${parentAlias}`);
    }

    if (source.type !== "entity") {
      throw new Error(
        `Select source with alias ${parentAlias} needs to be an entity but is ${source.type}`
      );
    }

    const parentEntity = source.source;

    this.addSource(nextAlias, nextEntity, "entity");

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
      identifier: TableIdentifierSqlBuilderFactory.createEntity(
        nextAlias,
        nextEntity
      ),

      parentAlias: parentAlias.toString(),
      parentField: parentField.toString(),
      comparison: comparison,
      select,

      type: "entity",
    });
  }

  public joinCTE<
    A extends string,
    C extends keyof G["CTEs"],
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    CTEName: C,
    CTEField: string,
    comparator: WhereComparator,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<
    Update<G, "JoinedEntities", G["JoinedEntities"] & Record<A, Object>>
  > {
    if (this.sourcesContext[targetAlias]) {
      throw new Error(`Select source with alias ${targetAlias} already exists`);
    }

    this.addSource(targetAlias, Object, "cte");

    this.joinViaComparison(
      parentAlias.toString(),
      parentField.toString(),
      comparator,
      targetAlias,
      this.getSource(targetAlias),
      TableIdentifierSqlBuilderFactory.createTablename(
        targetAlias,
        CTEName.toString()
      ),
      CTEField,
      false
    );

    return this as any;
  }

  public joinViaComparison(
    parentAlias: string,
    parentField: string,
    comparator: WhereComparator,
    nextAlias: string,
    nextSelectSource: SelectSource,
    nextSelectSourceIdentifier: TableIdentifierSqlBuilder,
    nextSelectSourceField: string,
    select: boolean
  ): void {
    const parentIdentifier = this.getColumnIdentifier(parentAlias, parentField);
    const childIdentifier = this.getColumnIdentifier(
      nextAlias,
      nextSelectSourceField
    );

    this.joins.push({
      alias: nextAlias,
      klass: nextSelectSource.source,

      identifier: nextSelectSourceIdentifier,
      parentAlias,
      parentField,
      comparison: ComparisonFactory.createColColIdentifiers(
        parentIdentifier,
        comparator,
        childIdentifier
      ),
      select,

      type: nextSelectSource.type,
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
    paramBuilder?: ParamBuilder
  ): Query {
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
      paramBuilder ?? this.paramBuilder
    ).buildSelect();
  }

  public async getEntities(): Promise<InstanceType<G["RootEntity"]>[]> {
    const query = this.getQuery(QueryResultType.ENTITIES);

    return this.client.withConnection(async (conn) =>
      QueryResultEntitiesParser.parse<G["RootEntity"]>(
        (await new QueryRunner(conn, query.sql, query.params).run()).rows,
        query.joinNodes!
      )
    );
  }

  public async getRaw(): Promise<
    keyof G["ExplicitSelects"] extends never
      ? UnionToIntersection<FlattenSelectSources<G["SelectedEntities"]>>[]
      : G["ExplicitSelects"][]
  > {
    const query = this.getQuery(QueryResultType.RAW);

    return this.client.withConnection(
      async (conn) =>
        RawQueryResultParser.parse(
          (await new QueryRunner(conn, query.sql, query.params).run()).rows
        ) as any
    );
  }
}
