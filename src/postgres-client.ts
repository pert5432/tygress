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
  WithConnectionOptions,
} from "./types/connection-settings";
import { Logger } from "./logger";
import { QueryLogLevel } from "./enums";
import { FlattenRawSelectSources } from "./types/query-builder";
import { MigrationRunner } from "./migration-runner";
import { MigrationGenerator } from "./migration-generator";

export class PostgresClient {
  private pool: Pool;

  private defaultConnectionSettings?: PostgresConnectionOptions;

  private logger: Logger;

  private migrationFolders?: string[];

  private entities: AnEntity[];

  constructor({
    databaseUrl,
    maxConnectionPoolSize,
    ssl,
    defaultConnectionOptions,
    queryLogLevel,
    entities,
    migrationFolders,
  }: PostgresClientOptions) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl,
      max: maxConnectionPoolSize ?? 20,
    });

    this.defaultConnectionSettings = defaultConnectionOptions;

    this.logger = new Logger(queryLogLevel ?? QueryLogLevel.ALL);

    this.migrationFolders = migrationFolders;
    this.entities = entities;
  }

  /**
    Creates an instance of an entity
    Does *not* save the entity to the database
  */
  public instantiate<T extends AnEntity>(
    entity: T,
    payload: Partial<InstanceType<T>>
  ): InstanceType<T>;

  /**
    Creates multiple instances of an entity
    Does *not* save them to the database
  */
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

  /**
    Gets a connection from the pool and returns it 
    Keep in mind you need to release the connection when you don't want to use it anymore
  */
  public async getConnection(
    settings?: PostgresConnectionOptions
  ): Promise<PostgresConnection> {
    return new PostgresConnection(
      await this.pool.connect(),
      this.logger,
      this.connectionSettings(settings)
    ).init();
  }

  /**
    Gets a connection from the pool and executes your function, passing the connection as an argument
    You need to use the connection passed as an argument to your function for your queries to run on that connection

    The connection is automatically released back to the pool after you function finishes executing
    You can also supply `closeConnection: true` in the settings to close the connection instead of putting it back in the pool
  */
  public async withConnection<T>(
    settings: WithConnectionOptions,
    fn: (connection: PostgresConnection) => T
  ): Promise<T>;

  /**
    Gets a connection from the pool and executes your function, passing the connection as an argument
    You need to use the connection passed as an argument to your function for your queries to run on that connection

    The connection is automatically released back to the pool after you function finishes executing
    You can also supply `closeConnection: true` in the settings to close the connection instead of putting it back in the pool
  */
  public async withConnection<T>(
    fn: (connection: PostgresConnection) => T
  ): Promise<T>;

  public async withConnection<T>(
    settingsOrFn:
      | WithConnectionOptions
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
      if (settings?.closeConnection) {
        connection.close();
      } else {
        connection.release();
      }
    }
  }

  // Creates a new instance of a query builder for the given entity
  public queryBuilder<A extends string, E extends AnEntity>(
    alias: A,
    entity: E,
    paramBuilder?: ParamBuilder
  ): QueryBuilder<{
    RootEntity: E;
    JoinedEntities: Record<A, E>;
    CTEs: {};
    ExplicitSelects: FlattenRawSelectSources<Record<A, E>>;
  }> {
    return new QueryBuilder<{
      RootEntity: E;
      JoinedEntities: Record<A, E>;
      CTEs: {};
      ExplicitSelects: FlattenRawSelectSources<Record<A, E>>;
    }>(
      this,
      alias,
      { type: "entity", source: entity },
      { [alias]: { type: "entity", source: entity } } as any,
      paramBuilder
    );
  }

  // Runs a SELECT query, returning entitites as a result
  public async select<T extends AnEntity>(
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    return this.withConnection((conn) => conn.select(entity, args));
  }

  /**
    Runs an INSERT statement using the provided values
    Optionally returns inserted rows as entities
  */
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

  /**
    Runs an UPDATE statement using the provided values and WHERE condition
    Optionally returns updated rows as entities
  */
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

  /**
    Runs a DELETE statement using the provided WHERE condition
    Optionally returns deleted rows as entities
  */
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

  // Executes an SQL statement
  public async query<T extends { [key: string]: any } = any>(
    sql: string,
    params?: any[],
    type: "QUERY" | "DML" = "QUERY"
  ): Promise<QueryResult<T>> {
    return this.withConnection((conn) => conn.query(sql, params ?? [], type));
  }

  /**
   * Executes all pending migrations
   */
  public async runMigrations(): Promise<void> {
    if (!this.migrationFolders?.length) {
      throw new Error(`No migrations path specified, can't run migrations`);
    }

    await this.withConnection(
      async (conn) =>
        await new MigrationRunner(conn, this.migrationFolders!).run()
    );
  }

  /**
   * Rolls back the last executed migration
   */
  public async rollbackLastMigration(): Promise<void> {
    if (!this.migrationFolders?.length) {
      throw new Error(`No migrations path specified, can't run migrations`);
    }

    await this.withConnection(
      async (conn) =>
        await new MigrationRunner(conn, this.migrationFolders!).rollback()
    );
  }

  /*
   * Creates a blank migration file in the first migrations folder
   */
  public async createBlankMigration(name: string): Promise<void> {
    const folderPath = (this.migrationFolders ?? [])[0];

    if (!folderPath) {
      throw new Error(
        `Can't generate a migration as no migration folders are specified`
      );
    }

    await new MigrationGenerator(this, this.entities).createBlank(
      name,
      folderPath
    );
  }

  /*
   * Generates a migration resolving the different between current database schema and Tygress entities
   */
  public async generateMigration(name: string): Promise<void> {
    const folderPath = (this.migrationFolders ?? [])[0];

    if (!folderPath) {
      throw new Error(
        `Can't generate a migration as no migration folders are specified`
      );
    }

    await new MigrationGenerator(this, this.entities).generate();
  }

  /**
   * Closes the connection pool, effectivelly turning off the client
   */
  public async close(): Promise<void> {
    await this.pool.end();
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
      collectSql:
        options.collectSql ?? this.defaultConnectionSettings?.collectSql,
      postgresConfig:
        options.postgresConfig ??
        this.defaultConnectionSettings?.postgresConfig,
    };
  }
}
