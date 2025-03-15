import { QueryResult } from "pg";
import { ConnectionWrapper } from "./connection-wrapper";

export class QueryRunner {
  constructor(
    private client: ConnectionWrapper,
    private sql: string,
    private params: any[]
  ) {}

  public async run(): Promise<QueryResult> {
    console.log(this.sql);
    console.log(this.params);

    return this.client.client.query(this.sql, this.params);
  }
}
