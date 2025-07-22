import { ClientConfig } from "pg";
import { AnEntity } from "..";
import { PostgresConnectionOptions } from ".";
import { QueryLogLevel } from "../../enums";

export type PostgresClientOptions = {
  // URL for connecting to the database in format: postgres://username:password@host:port/dbname
  databaseUrl: string;

  // Maximum number of connections to the database at one time, default: 20
  maxConnectionPoolSize?: number;

  // SSL config for connecting to the database
  ssl?: ClientConfig["ssl"];

  // These options will be passed to every connection opened by the client
  defaultConnectionOptions?: PostgresConnectionOptions;

  // What types of statements to log, default: ALL
  queryLogLevel?: QueryLogLevel;

  // If set to true logs will be colored for TTY output, default: true
  logColors?: boolean;

  entities: AnEntity[];

  // Path to file(s) containing migrations
  migrationFolders?: string[];
};
