import { PostgresClient } from "../postgres-client";

export const TEST_DB = new PostgresClient({
  databaseUrl: "postgres://petr@localhost:5437/tygress_test",
  ssl: false,
  entities: [],
});
