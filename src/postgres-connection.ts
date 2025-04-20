import { PoolClient } from "pg";

export class PostgresConnection {
  constructor(public $client: PoolClient) {}

  public query = this.$client.query;

  public release(): void {
    this.$client.release();
  }
}
