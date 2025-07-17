import path from "path";
import { PostgresClient } from "../../postgres-client";
import { AnEntity } from "../../types";

export const getClient = (entities: AnEntity[]): PostgresClient =>
  new PostgresClient({
    databaseUrl: process.env.DATABASE_URL!,
    ssl: false,
    entities,

    defaultConnectionOptions: {
      collectSql: true,
    },

    migrationFolders: [`${path.join(__dirname, "migrations")}`],
  });
