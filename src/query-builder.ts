import { JoinStrategy, JoinType, QueryResultType } from "./enums";
import {
  ColumnIdentifierSqlBuilderFactory,
  ComparisonFactory,
  JoinArgFactory,
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
import { Condition, ParameterArgs } from "./types/where-args";
import { RawQueryResultParser } from "./raw-query-result-parser";
import { UnionToIntersection } from "./types/helpers";
import {
  CteTableIdentifierSqlBuilder,
  TableIdentifierSqlBuilder,
} from "./sql-builders/table-identifier";
import {
  FlattenSelectSources,
  QueryBuilderGenerics,
  SelectSource,
  SelectSourceContext,
  SelectSourceField,
  SelectSourceKeys,
  SourcesContext,
  Stringify,
} from "./types/query-builder";
import { OrderByExpressionSqlBuilder } from "./sql-builders/order-by-expression";
import { QueryBuilderFactory } from "./query-builder-factory";
import { PostgresClient } from "./postgres-client";
import { Query } from "./types/query";
import { QueryRunner } from "./query-runner";
import { JoinImplArgs } from "./types/query-builder";
import { JoinFactory } from "./join-factory";

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
    selectSource: SelectSourceContext,
    sourcesContext: SourcesContext<G>,
    paramBuilder?: ParamBuilder
  ) {
    this.client = client;

    this.sourcesContext = sourcesContext;

    // Set the first join to be the root entity
    this.joins = [
      JoinArgFactory.create({
        alias,
        klass: selectSource.source,
        childType: selectSource.type,
        identifier: TableIdentifierSqlBuilderFactory.createSelectSourceContext(
          alias,
          selectSource
        ),
      }),
    ];

    this.paramBuilder = paramBuilder ?? new ParamBuilder();
  }

  private addSource(
    alias: string,
    source: SelectSource,
    type: "entity" | "cte"
  ): SelectSourceContext {
    if (this.sourcesContext[alias]) {
      throw new Error(`Select source with alias ${alias} already exists`);
    }

    const sourceContext = { source, type } as SelectSourceContext;

    this.sourcesContext = {
      ...this.sourcesContext,
      ...{ [alias]: sourceContext },
    };

    return sourceContext;
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
    const source = this.getSource(alias);

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

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: (
      qb: QueryBuilderFactory<{
        RootEntity: G["RootEntity"];
        JoinedEntities: {};
        CTEs: G["CTEs"];
        SelectedEntities: {};
        ExplicitSelects: {};
      }>
    ) => QueryBuilder<{
      RootEntity: AnEntity;
      JoinedEntities: any;
      CTEs: any;
      SelectedEntities: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: QueryBuilder<{
      RootEntity: any;
      JoinedEntities: any;
      CTEs: any;
      SelectedEntities: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

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
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }> {
    this.addSource(alias, Object, "cte");

    const resultQb =
      qb instanceof QueryBuilder ? qb : qb(this.childQbFactory());

    this.CTEs.push(TableIdentifierSqlBuilderFactory.createCTE(alias, resultQb));

    return this as any;
  }

  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    subQuery: (qb: QueryBuilderFactory<G>) => QueryBuilder<any>
  ): QueryBuilder<G>;

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
  >(alias: K, field: F, condition: Condition<Parametrizable>): QueryBuilder<G>;

  public where(sql: string, namedParams?: NamedParams): QueryBuilder<G>;

  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAliasOrSql: K | string,
    leftFieldOrParams: F | NamedParams | undefined,
    conditionOrComparator?: Condition<Parametrizable> | WhereComparator,
    rightAliasOrSubQuery?:
      | K
      | ((qb: QueryBuilderFactory<G>) => QueryBuilder<any>),
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

    // Now we know left side of the condition
    const left = this.getColumnIdentifier(
      leftAliasOrSql.toString(),
      leftFieldOrParams!.toString()
    );

    // Adding a "WHERE cmp (subquery)"
    if (
      typeof conditionOrComparator === "string" &&
      typeof rightAliasOrSubQuery === "function"
    ) {
      const resultQb = rightAliasOrSubQuery(this.childQbFactory());

      const subQueryIdentifier =
        TableIdentifierSqlBuilderFactory.createSubQuery(resultQb);

      this.wheres.push(
        ComparisonFactory.colTableIdentifier(
          left,
          conditionOrComparator,
          subQueryIdentifier
        )
      );

      return this;
    }

    // Adding a column cmp column condition
    if (typeof conditionOrComparator === "string") {
      const right = this.getColumnIdentifier(
        rightAliasOrSubQuery!.toString(),
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

    // Adding a WHERE based on a Comparison
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

  public selectSQL<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    f: () => T,
    params?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"] &
      Record<
        Alias,
        T extends abstract new (...args: any) => any ? InstanceType<T> : T
      >;
  }>;

  public selectSQL<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    params?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"] & Record<Alias, T>;
  }>;

  public selectSQL<T extends any, Alias extends string>(
    sql: string,
    as: Alias,
    fOrParams?: NamedParams | (() => T),
    _f?: () => T
  ) {
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
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"] &
      (K extends string
        ? F extends string
          ? Record<`${K}.${F}`, SelectSourceField<G["JoinedEntities"][K], F>>
          : {}
        : {});
  }>;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    A extends string
  >(
    alias: K,
    field: F,
    as: A
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"] &
      Record<A, SelectSourceField<G["JoinedEntities"][K], Stringify<F>>>;
  }>;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends "*",
    A extends undefined
  >(
    alias: K,
    field: F,
    as?: A
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"] &
      (K extends string
        ? FlattenSelectSources<Record<K, G["JoinedEntities"][K]>>
        : {});
  }>;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]> | "*",
    A extends string | undefined
  >(alias: K, field: F, as: A) {
    const source = this.getSource(alias.toString());
    const klass = source.source;

    if (field === "*" && source.type !== "entity") {
      throw new Error(`SELECT * FROM CTE is not supported yet`);
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

  // INNER JOIN

  public innerJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public innerJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.INNER, true)
      )
    );

    return this as any;
  }

  public innerJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public innerJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C,
    conditionFn: (
      j: Omit<
        JoinFactory<
          {
            RootEntity: G["RootEntity"];
            JoinedEntities: G["JoinedEntities"];
            CTEs: G["CTEs"];
            SelectedEntities: G["SelectedEntities"];
            ExplicitSelects: G["ExplicitSelects"];
          },
          A,
          G["CTEs"][C]
        >,
        "relation"
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, G["CTEs"][C]>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public innerJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.INNER, false)
      )
    );

    return this as any;
  }

  // CROSS JOIN

  public crossJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public crossJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, G["CTEs"][C]>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public crossJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string
  ) {
    const targetSelectSourceContext: SelectSourceContext =
      typeof targetEntityOrCTE === "string"
        ? { type: "cte", name: targetEntityOrCTE, source: Object }
        : { type: "entity", source: targetEntityOrCTE };

    const joinArgs: JoinImplArgs = {
      targetAlias,
      targetSelectSourceContext,

      select: false,

      type: JoinType.CROSS,
      strategy: JoinStrategy.CROSS,
    };

    this.joinImpl(joinArgs);

    return this as any;
  }

  // LEFT JOIN

  public leftJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public leftJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C,
    conditionFn: (
      j: Omit<
        JoinFactory<
          {
            RootEntity: G["RootEntity"];
            JoinedEntities: G["JoinedEntities"];
            CTEs: G["CTEs"];
            SelectedEntities: G["SelectedEntities"];
            ExplicitSelects: G["ExplicitSelects"];
          },
          A,
          G["CTEs"][C]
        >,
        "relation"
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, G["CTEs"][C]>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public leftJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.LEFT, false)
      )
    );

    return this as any;
  }

  public leftJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public leftJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.LEFT, true)
      )
    );

    return this as any;
  }

  // RIGHT JOIN

  public rightJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public rightJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C,
    conditionFn: (
      j: Omit<
        JoinFactory<
          {
            RootEntity: G["RootEntity"];
            JoinedEntities: G["JoinedEntities"];
            CTEs: G["CTEs"];
            SelectedEntities: G["SelectedEntities"];
            ExplicitSelects: G["ExplicitSelects"];
          },
          A,
          G["CTEs"][C]
        >,
        "relation"
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, G["CTEs"][C]>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public rightJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.RIGHT, false)
      )
    );

    return this as any;
  }

  public rightJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
          SelectedEntities: G["SelectedEntities"];
          ExplicitSelects: G["ExplicitSelects"];
        },
        A,
        E
      >
    ) => JoinImplArgs
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public rightJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFn: (j: JoinFactory<any, A, E>) => JoinImplArgs
  ) {
    this.joinImpl(
      conditionFn(
        new JoinFactory(targetAlias, targetEntityOrCTE, JoinType.RIGHT, true)
      )
    );

    return this as any;
  }

  // PRIVATE join impl

  private joinImpl(args: JoinImplArgs): void {
    const { strategy, targetAlias, targetSelectSourceContext } = args;

    if (this.sourcesContext[targetAlias]) {
      throw new Error(`Entity with alias ${targetAlias} is already joined in`);
    }

    const nextIdentifier =
      TableIdentifierSqlBuilderFactory.createSelectSourceContext(
        targetAlias,
        targetSelectSourceContext
      );

    const nextSource = // Add the join we are currently creating to the contexts so it can be referenced in the sql
      this.addSource(
        args.targetAlias,
        targetSelectSourceContext.source,
        targetSelectSourceContext.type
      );

    switch (strategy) {
      case JoinStrategy.RELATION:
        this.joinViaRelation(
          args,

          targetAlias,
          nextSource,
          nextIdentifier
        );
        break;

      case JoinStrategy.SQL:
        this.joinViaSql(args, targetAlias, nextSource, nextIdentifier);
        break;

      case JoinStrategy.COMPARISON:
        this.joinViaComparison(
          args,

          nextSource,
          nextIdentifier
        );
        break;

      case JoinStrategy.CROSS:
        this.joinCross(args, nextSource, nextIdentifier);
        break;

      default:
        throw new Error(`Invalid join strategy ${strategy}`);
    }
  }

  private joinViaRelation(
    args: JoinImplArgs,

    nextAlias: string,
    nextSource: SelectSourceContext,
    nextIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.RELATION) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.RELATION}`);
    }

    if (nextSource.type !== "entity") {
      throw new Error(
        `Select source with alias ${nextAlias} needs to be an entity but is ${nextSource.type}`
      );
    }

    const { parentAlias, parentField } = args;

    const parentSource = this.getSource(parentAlias);
    if (parentSource.type !== "entity") {
      throw new Error(
        `Select source with alias ${parentAlias} needs to be an entity but is ${parentSource.type}`
      );
    }

    const parentEntity = parentSource.source;

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

    this.joins.push(
      JoinArgFactory.create({
        alias: nextAlias,
        klass: nextSource.source,
        identifier: nextIdentifier,

        type: args.type,

        parentAlias: parentAlias.toString(),
        parentField: parentField.toString(),
        comparison: comparison,
        select: args.select,

        childType: nextSource.type,
      })
    );
  }

  private joinViaSql(
    args: JoinImplArgs,
    nextAlias: string,
    nextSource: SelectSourceContext,
    nextIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.SQL) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.SQL}`);
    }

    const { sql, select, namedParams, parentAlias, parentField } = args;

    if (select && !(parentAlias?.length && parentField?.length)) {
      throw new Error(
        `SQL join needs parent alias and parent field with select set to true`
      );
    }

    const targetSql = PseudoSQLReplacer.replaceIdentifiers(
      sql,
      this.sourcesContext
    );

    const comparison = ComparisonFactory.createSql(
      targetSql,
      namedParams ?? {}
    );

    this.joins.push(
      JoinArgFactory.create({
        alias: nextAlias,
        klass: nextSource.source,
        identifier: nextIdentifier,

        type: args.type,

        comparison,
        select,

        parentAlias,
        parentField,

        childType: nextSource.type,
      })
    );
  }

  private joinViaComparison(
    args: JoinImplArgs,

    nextSelectSource: SelectSourceContext,
    nextSelectSourceIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.COMPARISON) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.COMPARISON}`);
    }

    const { leftAlias, leftField, comparator, rightAlias, rightField } = args;

    const parentIdentifier = this.getColumnIdentifier(leftAlias, leftField);
    const childIdentifier = this.getColumnIdentifier(rightAlias, rightField);

    this.joins.push(
      JoinArgFactory.create({
        alias: rightAlias,
        klass: nextSelectSource.source,
        identifier: nextSelectSourceIdentifier,

        type: args.type,

        comparison: ComparisonFactory.createColColIdentifiers(
          parentIdentifier,
          comparator,
          childIdentifier
        ),

        select: args.select,

        childType: nextSelectSource.type,
      })
    );
  }

  private joinCross(
    args: JoinImplArgs,
    nextSelectSource: SelectSourceContext,
    nextSelectSourceIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.CROSS) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.CROSS}`);
    }

    if (args.type !== JoinType.CROSS) {
      throw new Error(
        `Join type needs to be ${JoinType.CROSS} to use ${JoinStrategy.CROSS} strategy`
      );
    }

    this.joins.push(
      JoinArgFactory.create({
        alias: args.targetAlias,
        klass: nextSelectSource.source,
        identifier: nextSelectSourceIdentifier,

        type: args.type,

        select: args.select,

        childType: nextSelectSource.type,
      })
    );
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

  public unselectAll(): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    SelectedEntities: G["SelectedEntities"];
    ExplicitSelects: {};
  }> {
    this.selects = [];

    return this as any;
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
