import { PostgresClient } from "./postgres-client";
import { QueryBuilder } from "./query-builder";
import { ParamBuilder } from "./sql-builders";
import { AnEntity } from "./types";
import { QueryBuilderGenerics, SourcesContext } from "./types/query-builder";

export type QueryBuilderFactoryArgs<G extends QueryBuilderGenerics> = {
  client: PostgresClient;
  sourcesContext?: SourcesContext<G>;
  paramBuilder?: ParamBuilder;
};

export class QueryBuilderFactory<G extends QueryBuilderGenerics> {
  private client: PostgresClient;
  private sourcesContext?: SourcesContext<G>;
  private paramBuilder?: ParamBuilder;

  constructor({
    client,
    sourcesContext,
    paramBuilder,
  }: QueryBuilderFactoryArgs<G>) {
    this.client = client;
    this.sourcesContext = sourcesContext;
    this.paramBuilder = paramBuilder;
  }

  // Create from a simple entity select
  public from<A extends string, E extends AnEntity>(
    alias: A,
    entity: E
  ): QueryBuilder<{
    RootEntity: E;
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    SelectedEntities: {};
    ExplicitSelects: {};
  }>;

  // Create from a select from CTE from outer query
  public from<C extends keyof G["CTEs"]>(
    cteAlias: C
  ): QueryBuilder<{
    RootEntity: new () => Object;
    JoinedEntities: G["JoinedEntities"] & Pick<G["CTEs"], C>;
    CTEs: {};
    SelectedEntities: {};
    ExplicitSelects: {};
  }>;

  public from<A extends string, E extends AnEntity>(alias: A, entity?: E) {
    // Simple entity select
    if (entity) {
      const sourcesContext: SourcesContext<G> = {
        ...(this.sourcesContext ?? {}),
        [alias]: { source: entity, type: "entity" },
      } as any;

      return new QueryBuilder(
        this.client,
        alias,
        entity,
        "entity",
        sourcesContext,
        this.paramBuilder
      ) as any;
    }

    // Select CTE from outer query
    if (!this.sourcesContext) {
      throw new Error(
        `Can't create a query builder from a CTE without outer query context`
      );
    }

    if (!this.sourcesContext[alias]) {
      throw new Error(`No CTE found with alias ${alias.toString()}`);
    }

    return new QueryBuilder(
      this.client,
      alias.toString(),
      Object,
      "cte",
      this.sourcesContext,
      this.paramBuilder
    ) as any;
  }
}
