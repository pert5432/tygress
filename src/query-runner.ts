import { QueryResult } from "pg";
import { PostgresConnection } from "./postgres-connection";

export class QueryRunner {
  constructor(
    private client: PostgresConnection,
    private sql: string,
    private params: any[]
  ) {}

  public async run(): Promise<QueryResult> {
    console.log(this.sql);
    console.log(this.params);

    return this.client.query(this.sql, this.params);
  }
}
