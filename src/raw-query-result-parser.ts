import { Query } from "./types/query";
import { ConnectionWrapper } from "./connection-wrapper";
import { QueryRunner } from "./query-runner";

export abstract class RawQueryResultParser {
  public static async run<T extends { [key: string]: any }>(
    client: ConnectionWrapper,
    { sql, params }: Query
  ): Promise<T[]> {
    console.log(sql);
    console.log(params);

    const { rows } = await new QueryRunner(client, sql, params).run();

    return rows;
  }
}
