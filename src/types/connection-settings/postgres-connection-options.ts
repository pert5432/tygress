import { PostgresConfigSettings } from ".";

export type PostgresConnectionOptions = {
  // If set to true the connection will collect all SQL ran in an array
  // This is mostly usefull for debugging/testing, you most likely do not want to have this on
  collectSql?: boolean;

  /**
    Postgres config settings which will be SET when the connection is opened

    for ex. passing `{work_mem: '512MB'}` will execute `SET work_mem = '512MB'`
  */
  postgresConfig?: Partial<PostgresConfigSettings>;
};

export type WithConnectionOptions = PostgresConnectionOptions & {
  // If set to true the connection will be closed after execution of the withConnection function is done
  closeConnection?: boolean;
};
