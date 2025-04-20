import { QueryResult } from "pg";
import { PostgresConnection } from "./postgres-connection";

export class QueryRunner {
  constructor(
    private client: PostgresConnection,
    private sql: string,
    private params: any[]
  ) {}

  public async run(): Promise<QueryResult> {
    return this.client.query(this.sql, this.params);
  }
}
