import { PostgresConfigSettings } from ".";

export type ConnectionLoggingOptions = {
  logLevel?: "ALL";
  collectSql?: boolean;
};

export type PostgresConnectionOptions = {
  logging?: ConnectionLoggingOptions;

  postgresConfig?: Partial<PostgresConfigSettings>;
};
