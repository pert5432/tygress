import { Client } from "pg";
import { Entity, SelectOptions } from "./types";
import { QueryBuilder } from "./query-builder";
import { QueryRunner } from "./query-runner";

export abstract class Repository {
  public static async select<T extends Entity<unknown>>(
    client: Client,
    entity: T,
    options: SelectOptions<InstanceType<T>>
  ) {
    const sql = new QueryBuilder(entity, options).buildSelect();

    console.log(sql);

    return await new QueryRunner(client, entity, sql).run();
  }
}
