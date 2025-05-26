import { describe, expect, test } from "vitest";
import { TEST_DB } from "../client";

describe("migrations", async () => {
  test("run", async () => {
    await TEST_DB.runMigrations();

    expect(
      (
        await TEST_DB.query(
          `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
          ["public", "tygress_migration_test"]
        )
      ).rows
    ).toHaveLength(1);

    expect(
      (await TEST_DB.query("SELECT name FROM tygress_migrations")).rows[0]?.name
    ).toBe("1748291362Test");
  });

  test("rollback", async () => {
    await TEST_DB.rollbackLastMigration();

    expect(
      (
        await TEST_DB.query(
          `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
          ["public", "tygress_migration_test"]
        )
      ).rows
    ).toHaveLength(0);

    expect(
      (await TEST_DB.query("SELECT name FROM tygress_migrations")).rows
    ).toHaveLength(0);
  });
});
