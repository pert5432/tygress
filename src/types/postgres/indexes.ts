// Defines a row in the pg_indexes view, hence the plural name
export type PostgresIndexes = {
  schemaname: string;

  tablename: string;

  indexname: string;

  tablespace: string;

  indexdef: string;
};
