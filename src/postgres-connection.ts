import { PoolClient } from "pg";

export class PostgresConnection {
  constructor(public $client: PoolClient) {}

  public query = this.$client.query;

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
}
