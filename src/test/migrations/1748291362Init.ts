import { PostgresConnection } from "../../postgres-connection";

export const name: string = "1748291362Init";

export const up = async (conn: PostgresConnection): Promise<void> => {
  await conn.query("SELECT 1");
};

export const down = async (conn: PostgresConnection): Promise<void> => {};
