import { PostgresConfigSettings } from ".";

export type PostgresConnectionOptions = {
  collectSql?: boolean;

  postgresConfig?: Partial<PostgresConfigSettings>;
};

export type WithConnectionOptions = PostgresConnectionOptions & {
  closeConnection?: boolean;
};
