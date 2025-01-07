import { Client } from "pg";
import { Entity, SelectArgs } from "./types";
import { SelectSqlBuilder } from "./sql-builders/select-sql-builder";
import { QueryRunner } from "./query-runner";

export abstract class Repository {
  public static async select<T extends Entity<any>>(
    client: Client,
    entity: T,
    options: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    const query = new SelectSqlBuilder(entity, options).buildSelect();

    console.log(query.sql);
    console.log(query.params);

    return await new QueryRunner(client, query).run();
  }
}
