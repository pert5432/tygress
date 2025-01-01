import { Client } from "pg";
import { Entity } from "./types";

export class QueryRunner<T extends Entity<unknown>> {
  constructor(private client: Client, private entity: T, private sql: string) {}

  public async run(): Promise<T[]> {
    await this.client.connect();

    return (await this.client.query(this.sql)).rows;
  }
}
