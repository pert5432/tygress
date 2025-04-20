import { ClientConfig, Pool, QueryResult } from "pg";
import { AnEntity, SelectArgs, Wheres } from "./types";
import { Repository } from "./repository";
import { ConnectionWrapper } from "./connection-wrapper";
import { ParamBuilder } from "./sql-builders";
import { QueryBuilder } from "./query-builder";
import { InsertPayload } from "./types/insert-payload";
import { InsertResult } from "./types/insert-result";
import { InsertOptions } from "./types/insert-options";
import { DeleteOptions } from "./types/delete-options";
import { DeleteResult } from "./types/delete-result";
import { UpdateOptions } from "./types/update-options";
import { UpdateResult } from "./types/update-result";

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

  public instantiate<T extends AnEntity>(
    entity: T,
    payload: Partial<InstanceType<T>>
  ): InstanceType<T>;

  public instantiate<T extends AnEntity>(
    entity: T,
    payload: Partial<InstanceType<T>>[]
  ): InstanceType<T>[];

  public instantiate<T extends AnEntity>(
    entity: T,
    payload: Partial<InstanceType<T>> | Partial<InstanceType<T>>[]
  ): T | T[] {
    const createMultiple = Array.isArray(payload);

    const entities = (createMultiple ? payload : [payload]).map((p) => {
      const e = new entity();

      for (const [key, value] of Object.entries(p)) {
        e[key] = value;
      }

      return e;
    });

    return createMultiple ? entities : entities[0];
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
      { type: "entity", source: entity },
      { [alias]: { type: "entity", source: entity } } as any,
      paramBuilder
    );

  public async select<T extends AnEntity>(
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    return this.withConnection((conn) => Repository.select(conn, entity, args));
  }

  public async insert<
    T extends AnEntity,
    ReturnedFields extends keyof InstanceType<T>,
    ConflictFields extends keyof InstanceType<T>,
    UpdateFields extends keyof InstanceType<T>
  >(
    entity: T,
    values: InsertPayload<T>[],
    options?: InsertOptions<T, ReturnedFields, ConflictFields, UpdateFields>
  ): Promise<InsertResult<T>> {
    return this.withConnection((conn) =>
      Repository.insert(conn, entity, values, options ?? {})
    );
  }

  public async update<
    T extends AnEntity,
    ReturnedFields extends keyof InstanceType<T>
  >(
    entity: T,
    values: Partial<InstanceType<T>>,
    where?: Wheres<InstanceType<T>>,
    options?: UpdateOptions<T, ReturnedFields>
  ): Promise<UpdateResult<T>> {
    return this.withConnection((conn) =>
      Repository.update(conn, entity, values, where ?? {}, options ?? {})
    );
  }

  public async delete<
    T extends AnEntity,
    ReturnedFields extends keyof InstanceType<T>
  >(
    entity: T,
    where?: Wheres<InstanceType<T>>,
    options?: DeleteOptions<T, ReturnedFields>
  ): Promise<DeleteResult<T>> {
    return this.withConnection((conn) =>
      Repository.delete(conn, entity, where ?? {}, options ?? {})
    );
  }

  public async query<T extends { [key: string]: any } = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.withConnection((conn) => conn.client.query(sql, params ?? []));
  }
}
