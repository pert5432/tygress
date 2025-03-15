import { ClientConfig, Pool } from "pg";
import { AnEntity, SelectArgs } from "./types";
import { Repository } from "./repository";
import { ConnectionWrapper } from "./connection-wrapper";
import { ParamBuilder } from "./sql-builders";
import { QueryBuilder } from "./query-builder";

export type PostgresClientOptions = {
  databaseUrl: string;
  maxConnectionPoolSize?: number;
  ssl?: ClientConfig["ssl"];

  entities: AnEntity[];
};

export class PostgresClient {
  private pool: Pool;

  constructor({
    databaseUrl,
    maxConnectionPoolSize,
    ssl,
    entities,
  }: PostgresClientOptions) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl,
      max: maxConnectionPoolSize ?? 20,
    });
  }

  public async withConnection<T>(
    fn: (connection: ConnectionWrapper) => T
  ): Promise<T> {
    const connection = new ConnectionWrapper(await this.pool.connect());

    try {
      return fn(connection);
    } finally {
      connection.client.release();
    }
  }

  public queryBuilder = <A extends string, E extends AnEntity>(
    alias: A,
    entity: E,
    paramBuilder?: ParamBuilder
  ) =>
    new QueryBuilder<{
      RootEntity: E;
      JoinedEntities: Record<A, E>;
      CTEs: {};
      SelectedEntities: Record<A, E>;
      ExplicitSelects: {};
    }>(
      this,
      alias,
      entity,
      "entity",
      { [alias]: { type: "entity", source: entity } } as any,
      paramBuilder
    );

  public async select<T extends AnEntity>(
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<T[]> {
    return this.withConnection((conn) => Repository.select(conn, entity, args));
  }
}
