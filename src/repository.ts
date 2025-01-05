import { Client } from "pg";
import { Entity, SelectOptions } from "./types";
import { QueryBuilder } from "./query-builder";
import { QueryRunner } from "./query-runner";

export abstract class Repository {
  public static async select<T extends Entity<any>>(
    client: Client,
    entity: T,
    options: SelectOptions<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    const query = new QueryBuilder(entity, options).buildSelect();

    console.log(query.sql);
    console.log(query.params);

    return await new QueryRunner(client, query).run();
  }
}
