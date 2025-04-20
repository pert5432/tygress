import { ClientConfig } from "pg";
import { AnEntity } from "..";
import { PostgresConnectionOptions } from ".";

export type PostgresClientOptions = {
  databaseUrl: string;
  maxConnectionPoolSize?: number;
  ssl?: ClientConfig["ssl"];

  defaultConnectionOptions?: PostgresConnectionOptions;

  entities: AnEntity[];
};
