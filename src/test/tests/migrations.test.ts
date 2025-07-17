import { describe, expect, test } from "vitest";
import { TEST_DB } from "../client";

describe("migrations", async () => {
  test("run", async () => {
    const existingMigrationsCount = (
      await TEST_DB.query("SELECT name FROM tygress_migrations")
    ).rows.length;

    await TEST_DB.runMigrations();

    // Test that table from the migration got created
    expect(
      (
        await TEST_DB.query(
          `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
          ["public", "tygress_migration_test"]
        )
      ).rows
    ).toHaveLength(1);

    const executedMigrations = (
      await TEST_DB.query(
        "SELECT name FROM tygress_migrations ORDER BY executed_at DESC"
      )
    ).rows;

    expect(executedMigrations.length).toBe(existingMigrationsCount + 1);
    expect(executedMigrations[0]?.name).toBe("1748291362Test");
  });

  test("rollback", async () => {
    const existingMigrationsCount = (
      await TEST_DB.query("SELECT name FROM tygress_migrations")
    ).rows.length;

    await TEST_DB.rollbackLastMigration();

    // Test that table from the migration got dropped
    expect(
      (
        await TEST_DB.query(
          `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
          ["public", "tygress_migration_test"]
        )
      ).rows
    ).toHaveLength(0);

    const executedMigrations = (
      await TEST_DB.query(
        "SELECT name FROM tygress_migrations ORDER BY executed_at DESC"
      )
    ).rows;

    expect(executedMigrations.length).toBe(existingMigrationsCount - 1);
  });
});
