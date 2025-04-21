import { PostgresConfigSettings } from ".";
import { QueryLogLevel } from "../../enums";

export type ConnectionLoggingOptions = {
  logLevel?: QueryLogLevel;
  collectSql?: boolean;
};

export type PostgresConnectionOptions = {
  logging?: ConnectionLoggingOptions;

  postgresConfig?: Partial<PostgresConfigSettings>;
};
