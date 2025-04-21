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
  public $sqlLog: { sql: string; params: any[] }[] = [];

  private state: "CONNECTED" | "INITIALIZING" | "READY" | "RELEASED" =
    "CONNECTED";

  private collectSql: boolean;

  private postgresSettings: Partial<PostgresConfigSettings>;

  constructor(
    public $client: PoolClient,
    private logger: Logger,
    options?: PostgresConnectionOptions
  ) {
    this.collectSql = options?.logging?.collectSql ?? false;
    this.postgresSettings = options?.postgresConfig ?? {};
  }

  // Sets the Postgres config values this connection has been created with
  public async init(): Promise<this> {
    this.state = "INITIALIZING";

    await this.setConfig(this.postgresSettings);

    this.state = "READY";

    return this;
  }

  public async select<T extends AnEntity>(
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    this.ensureReadiness();

    return Repository.select(this, entity, args);
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
    this.ensureReadiness();

    return Repository.insert(this, entity, values, options ?? {});
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
    this.ensureReadiness();

    return Repository.update(this, entity, values, where ?? {}, options ?? {});
  }

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

  public async begin(): Promise<void> {
    this.ensureReadiness();

    await this.query("BEGIN;");
  }

  public async commit(): Promise<void> {
    this.ensureReadiness();

    await this.query("COMMIT;");
  }

  public async rollback(): Promise<void> {
    this.ensureReadiness();

    await this.query("ROLLBACK;");
  }

  public async startTransaction(): Promise<void> {
    await this.begin();
  }

  public async commitTransaction(): Promise<void> {
    await this.commit();
  }

  public async rollbackTransaction(): Promise<void> {
    await this.rollback();
  }

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

  public release(): void {
    this.state = "RELEASED";

    this.$client.release();
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
