import { PostgresConnection } from "../../postgres-connection";

export const name: string = "1748291362Test";

export const up = async (conn: PostgresConnection): Promise<void> => {
  await conn.query("CREATE TABLE tygress_migration_test (id INT)");
};

export const down = async (conn: PostgresConnection): Promise<void> => {
  await conn.query("DROP TABLE tygress_migration_test");
};
