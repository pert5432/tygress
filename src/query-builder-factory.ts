import { PostgresClient } from "./postgres-client";
import { QueryBuilder } from "./query-builder";
import { ConstantBuilder } from "./sql-builders";
import { AnEntity } from "./types";
import { QueryBuilderGenerics, SourcesContext } from "./types/query-builder";

export type QueryBuilderFactoryArgs<G extends QueryBuilderGenerics> = {
  client: PostgresClient;
  sourcesContext?: SourcesContext<G>;
  constBuilder?: ConstantBuilder;
};

export class QueryBuilderFactory<G extends QueryBuilderGenerics> {
  private client: PostgresClient;
  private sourcesContext?: SourcesContext<G>;
  private constBuilder?: ConstantBuilder;

  constructor({
    client,
    sourcesContext,
    constBuilder,
  }: QueryBuilderFactoryArgs<G>) {
    this.client = client;
    this.sourcesContext = sourcesContext;
    this.constBuilder = constBuilder;
  }

  // Create from a simple entity select
  // Maintaining JoinedEntities and CTEs of parent query builder
  public from<A extends string, E extends AnEntity>(
    alias: A,
    entity: E
  ): QueryBuilder<{
    RootEntity: E;
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    ExplicitSelects: {};
  }>;

  // Create from a select from CTE from outer query
  // Maintaining JoinedEntities and CTEs of parent query builder and adding the selected CTE to JoinedEntities
  public from<C extends keyof G["CTEs"]>(
    cteAlias: C
  ): QueryBuilder<{
    RootEntity: new () => Object;
    JoinedEntities: G["JoinedEntities"] & Pick<G["CTEs"], C>;
    CTEs: G["CTEs"];
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
        { type: "entity", source: entity },
        sourcesContext,
        this.constBuilder
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
      { type: "cte", name: alias, source: Object },
      this.sourcesContext,
      this.constBuilder
    ) as any;
  }
}
