import { PostgresConnection } from "../postgres-connection";

export type Migration = {
  name: string;

  up: (conn: PostgresConnection) => Promise<void>;

  down: (conn: PostgresConnection) => Promise<void>;
};
