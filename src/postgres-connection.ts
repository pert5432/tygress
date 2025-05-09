import { PoolClient, QueryResult } from "pg";
import { AnEntity, SelectArgs, Wheres } from "./types";
import { Repository } from "./repository";
import { InsertPayload, InsertOptions, InsertResult } from "./types/insert";
import { UpdateOptions, UpdateResult } from "./types/update";
import { DeleteOptions, DeleteResult } from "./types/delete";
import {
  PostgresConfigSettings,
  PostgresConnectionOptions,
} from "./types/connection-settings";
import { Logger } from "./logger";

export class PostgresConnection {
  /**
    If options.collectSql is set to true 
    all SQL statements ran on this connection will be colected here
  */
  public $sqlLog: { sql: string; params: any[] }[] = [];

  /**
    The underlying pg client
    You should not need to use this
  */
  public $client: PoolClient;

  private state: "CONNECTED" | "INITIALIZING" | "READY" | "RELEASED" =
    "CONNECTED";
  private inTransaction: boolean = false;

  private collectSql: boolean;

  private postgresSettings: Partial<PostgresConfigSettings>;

  constructor(
    client: PoolClient,
    private logger: Logger,
    options?: PostgresConnectionOptions
  ) {
    this.$client = client;
    this.collectSql = options?.collectSql ?? false;
    this.postgresSettings = options?.postgresConfig ?? {};
  }

  // Sets the Postgres config values this connection has been created with
  public async init(): Promise<this> {
    this.state = "INITIALIZING";

    await this.setConfig(this.postgresSettings);

    this.state = "READY";

    return this;
  }

  // Runs a SELECT query, returning entitites as a result
  public async select<T extends AnEntity>(
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    this.ensureReadiness();

    return Repository.select(this, entity, args);
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
    this.ensureReadiness();

    return Repository.insert(this, entity, values, options ?? {});
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
    this.ensureReadiness();

    return Repository.update(this, entity, values, where ?? {}, options ?? {});
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
    this.ensureReadiness();

    return Repository.delete(this, entity, where ?? {}, options ?? {});
  }

  /** 
    Executes an SQL statement

    @param type is used to determine whether the statement should be logged or not
  */
  public async query<T extends { [key: string]: any } = any>(
    sql: string,
    params?: any[],
    type: "QUERY" | "DML" = "QUERY"
  ): Promise<QueryResult<T>> {
    this.ensureReadiness();

    if (this.collectSql) {
      this.$sqlLog.push({ sql, params: params ?? [] });
    }

    if (type === "DML") {
      this.logger.logDML(sql, params);
    } else {
      this.logger.logQuery(sql, params);
    }

    try {
      return await this.$client.query(sql, params ?? []);
    } catch (e) {
      this.logger.logQueryError(e as Error, sql, params);

      throw e;
    }
  }

  // Starts a transaction
  public async begin(): Promise<void> {
    this.ensureReadiness();

    await this.query("BEGIN;");

    this.inTransaction = true;
  }

  // Commits a transaction
  public async commit(): Promise<void> {
    this.ensureReadiness();

    await this.query("COMMIT;");

    this.inTransaction = false;
  }

  // Rolls back a transaction
  public async rollback(): Promise<void> {
    this.ensureReadiness();

    await this.query("ROLLBACK;");

    this.inTransaction = false;
  }

  // Starts a transaction
  public async startTransaction(): Promise<void> {
    await this.begin();
  }

  // Commits a transaction
  public async commitTransaction(): Promise<void> {
    await this.commit();
  }

  // Rolls back a transaction
  public async rollbackTransaction(): Promise<void> {
    await this.rollback();
  }

  /**
    Sets Postgres config settings

    for ex. passing `{work_mem: '512MB'}` will execute `SET work_mem = '512MB'`
  */
  public async setConfig(
    settings: Partial<PostgresConfigSettings>
  ): Promise<void> {
    if (!["READY", "CONNECTED", "INITIALIZING"].includes(this.state)) {
      throw new Error(
        `Can't set config of this connection because its state is ${this.state}`
      );
    }

    for (const [name, value] of Object.entries(settings)) {
      await this.query(`SET ${name} = '${value}'`);
    }
  }

  /**
    Releases the connection back to the pool
    You won't be able to run any queries on this connection afterwards
  */
  public release(): void {
    if (this.inTransaction) {
      throw new Error(
        `Can't release a connection that has an open transaction`
      );
    }

    this.state = "RELEASED";

    this.$client.release();
  }

  /**
    Closes the connection
    You won't be able to run any queries on this connection afterwards
  */
  public close(): void {
    if (this.state === "RELEASED") {
      throw new Error(
        `Can't close connection as its already released back to the pool`
      );
    }

    this.state = "RELEASED";

    this.$client.release(true);
  }

  //
  // PRIVATE
  //
  private ensureReadiness(): void {
    if (!["READY", "INITIALIZING"].includes(this.state)) {
      throw new Error(
        `Can't run more commands on this connection because its state is ${
          this.state
        } but it needs to be ${"READY"}`
      );
    }
  }
}
