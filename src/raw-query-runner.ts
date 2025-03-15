import { Query } from "./types/query";
import { ConnectionWrapper } from "./connection-wrapper";

export abstract class RawQueryRunner {
  public static async run<T extends { [key: string]: any }>(
    client: ConnectionWrapper,
    { sql, params }: Query
  ): Promise<T[]> {
    console.log(sql);
    console.log(params);

    const { rows } = await client.client.query<T>(sql, params);

    return rows;
  }
}
