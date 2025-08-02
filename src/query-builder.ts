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
  ConstantBuilder,
  ParametrizedConstantBuilder,
  SelectSqlBuilder,
  SelectTargetSqlBuilder,
  ColumnIdentifierSqlBuilder,
} from "./sql-builders";
import { AnEntity, Parametrizable, Pretty, WhereComparator } from "./types";
import { NamedParams } from "./types/named-params";
import { JoinArg } from "./types/query/join-arg";
import { Condition } from "./types/where-args";
import { RawQueryResultParser } from "./raw-query-result-parser";
import {
  CteTableIdentifierSqlBuilder,
  TableIdentifierSqlBuilder,
} from "./sql-builders/table-identifier";
import {
  FlattenRawSelectSources,
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
  private _distinct: boolean = false;
  private _distinctOn: ColumnIdentifierSqlBuilder[] = [];
  private CTEs: CteTableIdentifierSqlBuilder[] = [];

  private _limit?: number;
  private _offset?: number;

  private constBuilder: ConstantBuilder;

  constructor(
    client: PostgresClient,
    alias: string,
    selectSource: SelectSourceContext,
    sourcesContext: SourcesContext<G>,
    constBuilder?: ConstantBuilder
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

    this.constBuilder = constBuilder ?? new ParametrizedConstantBuilder();

    // Ensure the source entity is selected
    const tableMeta = METADATA_STORE.getTable_(selectSource.source);
    if (!tableMeta) {
      return;
    }

    for (const column of tableMeta.columnsSelectableByDefault) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createColumnIdentifier(
          ColumnIdentifierSqlBuilderFactory.createColumnMeta(alias, column),
          `${alias}.${column.fieldName}`,
          alias,
          column.fieldName
        )
      );
    }
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
      constBuilder: this.constBuilder,
    });
  }

  /**
   * Adds a CTE to the query
   *
   * @param alias alias of the CTE being added
   * @param qb function which takes a QueryBuilder instance as an argument and returns QueryBuilder
   */
  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: (
      qb: QueryBuilderFactory<{
        RootEntity: G["RootEntity"];
        JoinedEntities: {};
        CTEs: G["CTEs"];
        ExplicitSelects: {};
      }>
    ) => QueryBuilder<{
      RootEntity: AnEntity;
      JoinedEntities: any;
      CTEs: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a CTE to the query
   *
   * @param alias alias of the CTE being added
   * @param qb QueryBuilder of the CTE
   */
  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb: QueryBuilder<{
      RootEntity: any;
      JoinedEntities: any;
      CTEs: any;
      ExplicitSelects: T;
    }>
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public with<A extends string, T extends Record<string, any>>(
    alias: A,
    qb:
      | QueryBuilder<{
          RootEntity: any;
          JoinedEntities: any;
          CTEs: any;
          ExplicitSelects: T;
        }>
      | ((qb: QueryBuilderFactory<G>) => QueryBuilder<{
          RootEntity: any;
          JoinedEntities: any;
          CTEs: any;
          ExplicitSelects: T;
        }>)
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"] & Record<A, T>;
    ExplicitSelects: G["ExplicitSelects"];
  }> {
    this.addSource(alias, Object, "cte");

    const resultQb =
      qb instanceof QueryBuilder ? qb : qb(this.childQbFactory());

    this.CTEs.push(TableIdentifierSqlBuilderFactory.createCTE(alias, resultQb));

    return this as any;
  }

  /**
   * Adds a WHERE condition comparing a column to result of a subquery
   *
   * @param leftAlias
   * @param leftField
   * @param comparator
   * @param subQuery
   */
  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    subQuery: (qb: QueryBuilderFactory<G>) => QueryBuilder<any>
  ): QueryBuilder<G>;

  /**
   * Adds a WHERE condition comparing 2 columns
   *
   * @param leftAlias
   * @param leftField
   * @param comparator
   * @param rightAlias
   * @param rightField
   */
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

  /**
   * Adds a WHERE condition comparing a column to a parameter
   *
   * @param alias
   * @param field
   * @param condition
   */
  public where<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F, condition: Condition<Parametrizable>): QueryBuilder<G>;

  /**
   * Adds an SQL WHERE condition
   *
   * Entity field names are re-written to their column names,
   * for ex: `'a.firstName'` will become `"a"."first_name"` assuming the entity has a column called first_name defined on a field called firstName
   *
   * You can supply named params like this:
   * ```ts
   *  .where("a.firstName = :name", { name: "Joe" })
   * ```
   *
   * @param sql
   * @param namedParams
   */
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

  /**
   * Selects a column
   * The name of the selected column will be `alias.field`
   *
   * @param alias alias of the entity you are selecting from
   * @param field field name of the column you are selecting
   */
  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    A extends undefined
  >(
    alias: K,
    field: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"] &
      (K extends string
        ? F extends string
          ? Record<`${K}.${F}`, SelectSourceField<G["JoinedEntities"][K], F>>
          : {}
        : {});
  }>;

  /**
   * Selects a column and specifies an alias for it
   *
   * @param alias alias of the entity you are selecting from
   * @param field field name of the column you are selecting
   * @param as alias of the column you are selecting
   */
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
    ExplicitSelects: G["ExplicitSelects"] &
      Record<A, SelectSourceField<G["JoinedEntities"][K], Stringify<F>>>;
  }>;

  /**
   * Selects *all* columns of an entity
   * The columns will all have aliases in the form `alias.fieldName`
   *
   * Currently does not work for selecting all columns of a CTE, sorry :'(
   *
   *
   * @param alias alias of the entity you are selecting from
   * @param field *
   */
  public select<K extends keyof G["JoinedEntities"], F extends "*">(
    alias: K,
    field: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"] &
      (K extends string
        ? FlattenRawSelectSources<Record<K, G["JoinedEntities"][K]>>
        : {});
  }>;

  /**
   * Selects using a "raw" SQL statement
   *
   * Entity field names are re-written to their column names,
   * for ex: `'a.firstName'` will become `"a"."first_name"` assuming the entity has a column called first_name defined on a field called firstName
   *
   * You can supply named params like this:
   * ```ts
   *  .select("COALESCE(a.age, :defaultAge)", { defaultAge: 300 })
   * ```
   *
   * @param sql
   * @param alias alias of the selected column
   * @param params optional named params
   */
  public select<A extends string, T extends any = () => any>(
    sql: string,
    alias: A,
    params?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"] &
      Record<A, T extends (...args: any) => infer I ? I : T>;
  }>;

  public select<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]> | "*",
    A extends string
  >(
    aliasOrSql: K | string,
    fieldOrAs: F | string,
    asOrParams?: A | NamedParams
  ) {
    // SQL select
    if (aliasOrSql !== "*" && !this.sourcesContext[aliasOrSql]) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createSql(
          PseudoSQLReplacer.replaceIdentifiers(
            aliasOrSql.toString(),
            this.sourcesContext
          ),
          fieldOrAs.toString(),
          asOrParams
        )
      );

      return this as any;
    }

    // Field or * select

    const source = this.getSource(aliasOrSql.toString());
    const klass = source.source;

    if (fieldOrAs === "*" && source.type !== "entity") {
      throw new Error(`SELECT * FROM CTE is not supported yet`);
    }

    // TODO: this won't work for CTEs because they don't have an entity
    // TODO: proposed solution is to extract the SelectTargetSqlBuilders from the CTEs query builder and use them here
    // TODO: not sure how exactly to do it at this point, making the select targets a public attribute seems kinda unlucky
    const fieldNames: string[] =
      fieldOrAs === "*"
        ? METADATA_STORE.getTable(klass as AnEntity).columns.map(
            (e) => e.fieldName
          )
        : [fieldOrAs.toString()];

    const columnIdentifiers = fieldNames.map((f) => ({
      fieldName: f,
      identifier: this.getColumnIdentifier(aliasOrSql.toString(), f),
    }));

    for (const { identifier, fieldName } of columnIdentifiers) {
      this.selects.push(
        SelectTargetSqlBuilderFactory.createColumnIdentifier(
          identifier,
          typeof asOrParams === "string"
            ? asOrParams
            : `${aliasOrSql.toString()}.${fieldName}`,
          aliasOrSql.toString(),
          fieldName
        )
      );
    }

    return this as any;
  }

  /**
   * Selects a column and removes all other selects
   * The name of the selected column will be `alias.field`
   *
   * @param alias alias of the entity you are selecting from
   * @param field field name of the column you are selecting
   */
  public setSelect<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    alias: K,
    field: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: K extends string
      ? F extends string
        ? Record<`${K}.${F}`, SelectSourceField<G["JoinedEntities"][K], F>>
        : {}
      : {};
  }>;

  /**
   * Selects a column, specifies an alias for it and removes all other selects
   *
   * @param alias alias of the entity you are selecting from
   * @param field field name of the column you are selecting
   * @param as alias of the column you are selecting
   */
  public setSelect<
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
    ExplicitSelects: Record<
      A,
      SelectSourceField<G["JoinedEntities"][K], Stringify<F>>
    >;
  }>;

  /**
   * Selects *all* columns of an entity and removes all other selects
   * The columns will all have aliases in the form `alias.fieldName`
   *
   * Currently does not work for selecting all columns of a CTE, sorry :'(
   *
   *
   * @param alias alias of the entity you are selecting from
   * @param field *
   */
  public setSelect<K extends keyof G["JoinedEntities"], F extends "*">(
    alias: K,
    field: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: K extends string
      ? FlattenRawSelectSources<Record<K, G["JoinedEntities"][K]>>
      : {};
  }>;

  /**
   * Selects using a "raw" SQL statement and removes all other selects
   *
   * Entity field names are re-written to their column names,
   * for ex: `'a.firstName'` will become `"a"."first_name"` assuming the entity has a column called first_name defined on a field called firstName
   *
   * You can supply named params like this:
   * ```ts
   *  .select("COALESCE(a.age, :defaultAge)", { defaultAge: 300 })
   * ```
   *
   * @param sql
   * @param alias alias of the selected column
   * @param params optional named params
   */
  public setSelect<A extends string, T extends any = () => any>(
    sql: string,
    alias: A,
    params?: NamedParams
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: Record<A, T extends (...args: any) => infer I ? I : T>;
  }>;

  public setSelect<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]> | "*",
    A extends string
  >(
    aliasOrSql: K | string,
    fieldOrAs: F | string,
    asOrParams?: A | NamedParams
  ) {
    // SQL select
    if (aliasOrSql !== "*" && !this.sourcesContext[aliasOrSql]) {
      this.selects = [
        SelectTargetSqlBuilderFactory.createSql(
          PseudoSQLReplacer.replaceIdentifiers(
            aliasOrSql.toString(),
            this.sourcesContext
          ),
          fieldOrAs.toString(),
          asOrParams
        ),
      ];

      return this as any;
    }

    // Field or * select

    const source = this.getSource(aliasOrSql.toString());
    const klass = source.source;

    if (fieldOrAs === "*" && source.type !== "entity") {
      throw new Error(`SELECT * FROM CTE is not supported yet`);
    }

    // TODO: this won't work for CTEs because they don't have an entity
    // TODO: proposed solution is to extract the SelectTargetSqlBuilders from the CTEs query builder and use them here
    // TODO: not sure how exactly to do it at this point, making the select targets a public attribute seems kinda unlucky
    const fieldNames: string[] =
      fieldOrAs === "*"
        ? METADATA_STORE.getTable(klass as AnEntity).columns.map(
            (e) => e.fieldName
          )
        : [fieldOrAs.toString()];

    const columnIdentifiers = fieldNames.map((f) => ({
      fieldName: f,
      identifier: this.getColumnIdentifier(aliasOrSql.toString(), f),
    }));

    this.selects = columnIdentifiers.map(({ identifier, fieldName }) =>
      SelectTargetSqlBuilderFactory.createColumnIdentifier(
        identifier,
        typeof asOrParams === "string"
          ? asOrParams
          : `${aliasOrSql.toString()}.${fieldName}`,
        aliasOrSql.toString(),
        fieldName
      )
    );

    return this as any;
  }

  /**
   * Adds an ORDER BY statement
   *
   * @param alias alias of entity
   * @param field fieldName of entity you want to order by
   * @param order direction of order, default: `ASC`
   */
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

  //
  // INNER JOIN AND SELECT
  //

  /**
   * Adds an INNER JOIN and selects all columns of the joined entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public innerJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  /**
   * Adds an INNER JOIN and selects all columns of the joined entity
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public innerJoinAndSelect<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  public innerJoinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.INNER,
      true,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // INNER JOIN
  //

  /**
   * Adds an INNER JOIN
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public innerJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds an INNER JOIN to a CTE
   *
   * Generates SQL like:
   * ```sql
   * INNER JOIN `CTEName` `targetAlias` ON `condition`
   * ```
   *
   * @param targetAlias alias given to the CTE in the join
   * @param CTEName name of the existing CTE
   * @param conditionFn join condition function
   */
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds an INNER JOIN
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public innerJoin<
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public innerJoin<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.INNER,
      false,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // INNER JOIN AND MAP
  //

  /**
   * Adds an INNER JOIN, selects all the columns of the joined entity and maps the result to the relation field on the parent entity
   *
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public innerJoinAndMap<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }> {
    this.joinImpl(
      new JoinFactory(
        targetAlias,
        targetEntity,
        JoinType.INNER,
        true,
        true
      ).relation(parentAlias.toString(), parentField)
    );

    return this as any;
  }

  //
  // LEFT JOIN
  //

  /**
   * Adds a LEFT JOIN
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public leftJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a LEFT JOIN to a CTE
   *
   * Generates SQL like:
   * ```sql
   * LEFT JOIN `CTEName` `targetAlias` ON `condition`
   * ```
   *
   * @param targetAlias alias given to the CTE in the join
   * @param CTEName name of the existing CTE
   * @param conditionFn join condition function
   */
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a LEFT JOIN
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public leftJoin<
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public leftJoin<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.LEFT,
      false,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // LEFT JOIN AND SELECT
  //

  /**
   * Adds a LEFT JOIN and selects all columns of the joined entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public leftJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  /**
   * Adds an INNER JOIN and selects all columns of the joined entity
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public leftJoinAndSelect<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  public leftJoinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.LEFT,
      true,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // LEFT JOIN AND MAP
  //

  /**
   * Adds a LEFT JOIN, selects all the columns of the joined entity and maps the result to the relation field on the parent entity
   *
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public leftJoinAndMap<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    parentAlias: K,
    parentField: F
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }> {
    this.joinImpl(
      new JoinFactory(
        targetAlias,
        targetEntityOrCTE,
        JoinType.LEFT,
        true,
        true
      ).relation(parentAlias.toString(), parentField)
    );

    return this as any;
  }

  //
  // RIGHT JOIN
  //

  /**
   * Adds a RIGHT JOIN
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public rightJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];

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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a RIGHT JOIN to a CTE
   *
   * Generates SQL like:
   * ```sql
   * RIGHT JOIN `CTEName` `targetAlias` ON `condition`
   * ```
   *
   * @param targetAlias alias given to the CTE in the join
   * @param CTEName name of the existing CTE
   * @param conditionFn join condition function
   */
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a RIGHT JOIN
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public rightJoin<
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public rightJoin<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.RIGHT,
      false,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // RIGHT JOIN AND SELECT
  //

  /**
   * Adds a RIGHT JOIN, selects all the columns of the joined entity and maps the result to the relation field on the parent entity
   *
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public rightJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  /**
   * Adds a RIGHT JOIN and selects all columns of the joined entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public rightJoinAndSelect<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  public rightJoinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.RIGHT,
      true,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // FULL JOIN AND SELECT
  //

  /**
   * Adds a FULL JOIN and selects all columns of the joined entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public fullJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  /**
   * Adds a FULL JOIN and selects all columns of the joined entity
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public fullJoinAndSelect<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  public fullJoinAndSelect<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.FULL,
      true,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // FULL JOIN
  //

  /**
   * Adds a FULL JOIN
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param conditionFn join condition function
   */
  public fullJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E,
    conditionFn: (
      j: JoinFactory<
        {
          RootEntity: G["RootEntity"];
          JoinedEntities: G["JoinedEntities"];
          CTEs: G["CTEs"];

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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a FULL JOIN to a CTE
   *
   * Generates SQL like:
   * ```sql
   * FULL JOIN `CTEName` `targetAlias` ON `condition`
   * ```
   *
   * @param targetAlias alias given to the CTE in the join
   * @param CTEName name of the existing CTE
   * @param conditionFn join condition function
   */
  public fullJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C,
    conditionFn: (
      j: Omit<
        JoinFactory<
          {
            RootEntity: G["RootEntity"];
            JoinedEntities: G["JoinedEntities"];
            CTEs: G["CTEs"];

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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a FULL JOIN
   * Uses a relation for the join condition
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public fullJoin<
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
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  public fullJoin<
    A extends string,
    E extends AnEntity,
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(
    targetAlias: A,
    targetEntityOrCTE: E | string,
    conditionFnOrParentAlias: ((j: JoinFactory<any, A, E>) => JoinImplArgs) | K,
    optionalParentField?: F
  ) {
    const joinFactory = new JoinFactory(
      targetAlias,
      targetEntityOrCTE,
      JoinType.FULL,
      false,
      false
    );

    if (typeof conditionFnOrParentAlias === "function") {
      this.joinImpl(conditionFnOrParentAlias(joinFactory));
    } else {
      this.joinImpl(
        joinFactory.relation(
          conditionFnOrParentAlias.toString(),
          optionalParentField!
        )
      );
    }

    return this as any;
  }

  //
  // CROSS JOIN AND SELECT
  //

  /**
   * Adds a CROSS JOIN with an entity and selects all its columns
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public crossJoinAndSelect<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }>;

  public crossJoinAndSelect<A extends string, E extends AnEntity>(
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

      select: true,

      type: JoinType.CROSS,
      strategy: JoinStrategy.CROSS,
    };

    this.joinImpl(joinArgs);

    return this as any;
  }

  //
  // CROSS JOIN
  //

  /**
   * Adds a CROSS JOIN with an entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   */
  public crossJoin<A extends string, E extends AnEntity>(
    targetAlias: A,
    targetEntity: E
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    ExplicitSelects: G["ExplicitSelects"];
  }>;

  /**
   * Adds a CROSS JOIN with a CTE
   *
   * @param targetAlias alias of the newly joined CTE
   * @param CTEName name of the existing CTE
   */
  public crossJoin<A extends string, C extends keyof G["CTEs"]>(
    targetAlias: A,
    CTEName: C
  ): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"] & Record<A, G["CTEs"][C]>;
    CTEs: G["CTEs"];
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

  //
  // CROSS JOIN AND MAP
  //

  /**
   * Adds a CROSS JOIN, selects all the columns of the joined entity and maps the result to the relation field on the parent entity
   *
   * @param targetAlias alias of the newly joined entity
   * @param targetEntity entity being joined in
   * @param parentAlias
   * @param parentField together with parentAlias it forms the parent side of the relation
   */
  public crossJoinAndMap<
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
    ExplicitSelects: G["ExplicitSelects"] &
      FlattenRawSelectSources<Record<A, E>>;
  }> {
    const targetSelectSourceContext: SelectSourceContext =
      typeof targetEntity === "string"
        ? { type: "cte", name: targetEntity, source: Object }
        : { type: "entity", source: targetEntity };

    const joinArgs: JoinImplArgs = {
      targetAlias,
      targetSelectSourceContext,

      mapToAlias: parentAlias.toString(),
      mapToField: parentField.toString(),
      select: true,
      map: true,

      type: JoinType.CROSS,
      strategy: JoinStrategy.CROSS,
    };

    this.joinImpl(joinArgs);

    return this as any;
  }

  //
  // PRIVATE JOIN IMPL
  //
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

          nextSource,
          nextIdentifier
        );
        break;

      case JoinStrategy.SQL:
        this.joinViaSql(args, nextSource, nextIdentifier);
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

    // Select all columns from the newly joined entity
    if (args.select) {
      if (nextSource.type !== "entity") {
        throw new Error(
          `Can't automatically select all columns from a source that isn't an entity`
        );
      }

      const tableMeta = METADATA_STORE.getTable(nextSource.source);
      for (const column of tableMeta.columnsSelectableByDefault) {
        this.selects.push(
          SelectTargetSqlBuilderFactory.createColumnIdentifier(
            ColumnIdentifierSqlBuilderFactory.createColumnMeta(
              targetAlias,
              column
            ),
            `${targetAlias}.${column.fieldName}`,
            targetAlias,
            column.fieldName
          )
        );
      }
    }
  }

  private joinViaRelation(
    args: JoinImplArgs,

    nextSource: SelectSourceContext,
    nextIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.RELATION) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.RELATION}`);
    }

    const { targetAlias } = args;

    if (nextSource.type !== "entity") {
      throw new Error(
        `Select source with alias ${targetAlias} needs to be an entity but is ${nextSource.type}`
      );
    }

    const { parentAlias, parentField, map, select } = args;

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
      targetAlias,
      relation
    );

    this.joins.push(
      JoinArgFactory.create({
        alias: targetAlias,
        klass: nextSource.source,
        identifier: nextIdentifier,

        type: args.type,

        parentAlias: parentAlias.toString(),
        parentField: parentField.toString(),
        comparison: comparison,

        select,
        map,

        childType: nextSource.type,
      })
    );
  }

  private joinViaSql(
    args: JoinImplArgs,
    nextSource: SelectSourceContext,
    nextIdentifier: TableIdentifierSqlBuilder
  ): void {
    if (args.strategy !== JoinStrategy.SQL) {
      throw new Error(`Join strategy needs to be ${JoinStrategy.SQL}`);
    }

    const {
      targetAlias,
      sql,
      select,
      namedParams,
      map,
      mapToAlias,
      mapToField,
    } = args;

    if (map && !(mapToAlias?.length && mapToField?.length)) {
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
        alias: targetAlias,
        klass: nextSource.source,
        identifier: nextIdentifier,

        type: args.type,

        comparison,

        select,
        map,

        parentAlias: mapToAlias,
        parentField: mapToField,

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

    const {
      targetAlias,
      leftAlias,
      leftField,
      comparator,
      rightAlias,
      rightField,
      select,
      map,
    } = args;

    const parentIdentifier = this.getColumnIdentifier(leftAlias, leftField);
    const childIdentifier = this.getColumnIdentifier(rightAlias, rightField);

    this.joins.push(
      JoinArgFactory.create({
        alias: targetAlias,
        klass: nextSelectSource.source,
        identifier: nextSelectSourceIdentifier,

        type: args.type,

        comparison: ComparisonFactory.createColColIdentifiers(
          parentIdentifier,
          comparator,
          childIdentifier
        ),

        select,
        map,

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

        parentAlias: args.mapToAlias,
        parentField: args.mapToField,
        select: args.select,
        map: args.map,

        childType: nextSelectSource.type,
      })
    );
  }

  /**
   * Adds a GROUP BY clause
   * Repeat calls add more columns to group by
   *
   * @param alias
   * @param field together with alias specifies the column which to group by
   */
  public groupBy<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F): this {
    this.groupBys.push(
      this.getColumnIdentifier(alias.toString(), field.toString())
    );

    return this;
  }

  /**
   * Adds a limit clause, repeat calls override the value
   */
  public limit(val: number): this {
    this._limit = val;

    return this;
  }

  /**
   * Removes any limit clause present
   */
  public removeLimit(): this {
    this._limit = undefined;

    return this;
  }

  /**
   * Adds an offset clause, repeat calls override the value
   *
   * @param val
   * @returns
   */
  public offset(val: number): this {
    this._offset = val;

    return this;
  }

  /**
   * Removes any offset clause present
   */
  public removeOffset(): this {
    this._offset = undefined;

    return this;
  }

  /**
   * Adds `DISTINCT` to the query or removes it when called with `false`
   *
   * @param value
   */
  public distinct(value: boolean = true): this {
    this._distinct = value;

    return this;
  }

  /**
   * Adds DISTINCT ON clause
   * Repeat calls add more columns to the clause
   *
   * @param alias
   * @param field
   */
  public distinctOn<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(alias: K, field: F): this {
    this._distinctOn.push(
      this.getColumnIdentifier(alias.toString(), field.toString())
    );

    return this;
  }

  /**
   * Removes all selected columns
   */
  public unselectAll(): QueryBuilder<{
    RootEntity: G["RootEntity"];
    JoinedEntities: G["JoinedEntities"];
    CTEs: G["CTEs"];
    ExplicitSelects: {};
  }> {
    this.selects = [];

    return this as any;
  }

  /**
   * Removes all ORDER BY clauses
   */
  public removeOrderBys(): this {
    this.orderBys = [];

    return this;
  }

  /**
   * Returns SQL + params array of the query
   *
   * @param resultType specifies whether query is supposed to return entities or raw results
   * @param constBuilder
   */
  public getQuery(
    resultType: QueryResultType,
    constBuilder?: ConstantBuilder
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

        distinct: this._distinct,
        distinctOn: this._distinctOn,
      },
      constBuilder ?? this.constBuilder
    ).buildSelect();
  }

  /**
   * Executes the query and returns the result as entities
   */
  public async getEntities(): Promise<InstanceType<G["RootEntity"]>[]> {
    const query = this.getQuery(QueryResultType.ENTITIES);

    return this.client.withConnection(async (conn) =>
      QueryResultEntitiesParser.parse<G["RootEntity"]>(
        (await conn.query(query.sql, query.params)).rows,
        query.joinNodes!
      )
    );
  }

  /**
   * Executes the query and returns the first entity or null
   *
   * This does **not** add a `LIMIT 1` to the query so the whole result will be retrieved
   */
  public async getOneEntity(): Promise<InstanceType<G["RootEntity"]> | null> {
    return (await this.getEntities())[0] ?? null;
  }

  /**
   * Executes the query and returns the raw result the way it comes from the pg client
   */
  public async getRaw(): Promise<Pretty<G["ExplicitSelects"]>[]> {
    const query = this.getQuery(QueryResultType.RAW);

    return this.client.withConnection(
      async (conn) =>
        RawQueryResultParser.parse(
          (await conn.query(query.sql, query.params)).rows
        ) as any
    );
  }

  /**
   * Executes the query and returns the first row or null
   *
   * This does **not** add a `LIMIT 1` to the query so the whole result will be retrieved
   */
  public async getOneRaw(): Promise<Pretty<G["ExplicitSelects"]> | null> {
    return (await this.getRaw())[0] ?? null;
  }
}
