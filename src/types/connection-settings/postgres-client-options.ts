import { ClientConfig } from "pg";
import { AnEntity } from "..";
import { PostgresConnectionOptions } from ".";
import { QueryLogLevel } from "../../enums";

export type PostgresClientOptions = {
  databaseUrl: string;
  maxConnectionPoolSize?: number;
  ssl?: ClientConfig["ssl"];

  defaultConnectionOptions?: PostgresConnectionOptions;

  queryLogLevel?: QueryLogLevel;

  entities: AnEntity[];
};
