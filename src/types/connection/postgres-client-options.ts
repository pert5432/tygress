import { ClientConfig } from "pg";
import { AnEntity } from "..";
import { PostgresConnectionOptions } from ".";
import { QueryLogLevel } from "../../enums";

export type PostgresClientOptions = {
  /**
   * URL for connecting to the database in format: postgres://username:password@host:port/dbname
   */
  databaseUrl: string;

  /**
   * All entities you want this client to have access to
   * This most likely means all entities in your code unless you are using multiple clients
   */
  entities: AnEntity[];

  /**
   * Maximum number of connections to the database at one time
   * @defaultValue 20
   */
  maxConnectionPoolSize?: number;

  /**
   * SSL config for connecting to the database, default: OFF
   */
  ssl?: ClientConfig["ssl"];

  /**
   * Controls what types of statements to log, default: ALL
   */
  queryLogLevel?: QueryLogLevel;

  /**
   * Controls whether logs will be colored for TTY output, default: true
   */
  logColors?: boolean;

  /**
   * These options will be passed to every connection opened by the client
   *
   * For ex. passing `{work_mem: '512MB'}` will execute `SET work_mem = '512MB'` on every new connection
   */
  defaultConnectionOptions?: PostgresConnectionOptions;

  /**
   * Paths to folders containing migration files
   */
  migrationFolders?: string[];
};
