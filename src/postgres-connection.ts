import { PoolClient, QueryResult } from "pg";

export type PostgresConfigSettings = {
  work_mem: string | number;
};

export type ConnectionLoggingOptions = {
  logLevel?: "ALL";
  collectSql?: boolean;
};

export type PostgresConnectionOptions = {
  logging?: ConnectionLoggingOptions;

  postgresConfig?: PostgresConfigSettings;
};

export class PostgresConnection {
  public $sqlLog: { sql: string; params: any[] }[] = [];

  private collectSql: boolean;
  private logLevel: "ALL" | "NOTHING";

  constructor(public $client: PoolClient, options?: PostgresConnectionOptions) {
    this.collectSql = options?.logging?.collectSql ?? false;
    this.logLevel = options?.logging?.logLevel ?? "ALL";
  }

  public async query<T extends { [key: string]: any } = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (this.shouldLog()) {
      console.log("Query");
      console.log(sql);
      console.log(params ?? []);
    }

    if (this.collectSql) {
      this.$sqlLog.push({ sql, params: params ?? [] });
    }

    return this.$client.query(sql, params ?? []);
  }

  public async begin(): Promise<void> {
    await this.query("BEGIN;");
  }

  public async commit(): Promise<void> {
    await this.query("COMMIT;");
  }

  public async rollback(): Promise<void> {
    await this.query("ROLLBACK");
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

  public release(): void {
    this.$client.release();
  }

  //
  // PRIVATE
  //
  private shouldLog(): boolean {
    if (this.logLevel === "ALL") {
      return true;
    }

    return false;
  }
}
