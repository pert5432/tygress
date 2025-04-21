import { Pool, QueryResult } from "pg";
import { AnEntity, SelectArgs, Wheres } from "./types";
import { PostgresConnection } from "./postgres-connection";
import { ParamBuilder } from "./sql-builders";
import { QueryBuilder } from "./query-builder";
import { InsertPayload, InsertResult, InsertOptions } from "./types/insert";
import { DeleteOptions, DeleteResult } from "./types/delete";
import { UpdateOptions, UpdateResult } from "./types/update";
import {
  PostgresClientOptions,
  PostgresConnectionOptions,
} from "./types/connection-settings";
import { Logger } from "./logger";
import { QueryLogLevel } from "./enums";

export class PostgresClient {
  private pool: Pool;

  private defaultConnectionSettings?: PostgresConnectionOptions;

  private logger: Logger;

  constructor({
    databaseUrl,
    maxConnectionPoolSize,
    ssl,
    defaultConnectionOptions,
    entities,
  }: PostgresClientOptions) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl,
      max: maxConnectionPoolSize ?? 20,
    });

    this.defaultConnectionSettings = defaultConnectionOptions;

    this.logger = new Logger(
      defaultConnectionOptions?.logging?.logLevel ?? QueryLogLevel.ALL
    );
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

  public async getConnection(
    settings?: PostgresConnectionOptions
  ): Promise<PostgresConnection> {
    return new PostgresConnection(
      await this.pool.connect(),
      this.logger,
      this.connectionSettings(settings)
    ).init();
  }

  public async withConnection<T>(
    settings: PostgresConnectionOptions,
    fn: (connection: PostgresConnection) => T
  ): Promise<T>;

  public async withConnection<T>(
    fn: (connection: PostgresConnection) => T
  ): Promise<T>;

  public async withConnection<T>(
    settingsOrFn:
      | PostgresConnectionOptions
      | ((connection: PostgresConnection) => T),
    optionalFn?: (connection: PostgresConnection) => T
  ): Promise<T> {
    const fn = typeof settingsOrFn === "function" ? settingsOrFn : optionalFn!;
    const settings =
      typeof settingsOrFn === "object" ? settingsOrFn : undefined;

    if (!fn) {
      throw new Error(`No function provided to withConnection`);
    }

    const connection = await this.getConnection(settings);

    try {
      return await fn(connection);
    } finally {
      connection.release();
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
    return this.withConnection((conn) => conn.select(entity, args));
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
      conn.insert(entity, values, options ?? {})
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
      conn.update(entity, values, where ?? {}, options ?? {})
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
      conn.delete(entity, where ?? {}, options ?? {})
    );
  }

  public async query<T extends { [key: string]: any } = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.withConnection((conn) => conn.query(sql, params ?? []));
  }

  //
  // PRIVATE
  //
  private connectionSettings(
    options?: PostgresConnectionOptions
  ): PostgresConnectionOptions | undefined {
    if (!options) {
      return this.defaultConnectionSettings;
    }

    return {
      logging: options.logging ?? this.defaultConnectionSettings?.logging,
      postgresConfig:
        options.postgresConfig ??
        this.defaultConnectionSettings?.postgresConfig,
    };
  }
}
