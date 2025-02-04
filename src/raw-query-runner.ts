import { Client } from "pg";
import { Query } from "./types/query";

export abstract class RawQueryRunner {
  public static async run<T extends { [key: string]: any }>(
    client: Client,
    { sql, params }: Query
  ): Promise<T[]> {
    console.log(sql);
    console.log(params);

    const { rows } = await client.query<T>(sql, params);

    return rows;
  }
}
