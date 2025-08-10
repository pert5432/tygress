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

/**
 * Factory for creating query builders for subqueries
 * Takes in the parent query builder's sourcesContext to be able to reference tables from parent query in the subquery
 *
 * Takes in the parent query builder's constBuilder to maintain unique param numbers between parent and child queries
 */
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

  /**
   * Simple entity select
   * Adds the entity to JoinedEntities
   */
  public from<A extends string, E extends AnEntity>(
    alias: A,
    entity: E
  ): QueryBuilder<{
    RootEntity: E;
    JoinedEntities: G["JoinedEntities"] & Record<A, E>;
    CTEs: G["CTEs"];
    ExplicitSelects: {};
  }>;

  /**
   * `SELECT` from a CTE from outer query
   * Adds the selected CTE to JoinedEntities
   */
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
