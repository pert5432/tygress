import { beforeAll, describe, expect, test } from "vitest";
import { getClient } from "./client";
import { countMigrationFiles } from "./count-migration-files";
import { validateLatestMigration } from "./validate-latest-migration";
import { Members, Groups, Groups2, Members2 } from "./entities/";
import { wipeMigrations } from "./wipe-migrations";

describe("migration generation", async () => {
  // Recreate migrations folder after tests finish
  beforeAll(async () => {
    wipeMigrations();

    // Drop tables used for migration tests
    await getClient([Members, Groups, Members2, Groups2]).query(
      "DROP TABLE IF EXISTS members, groups, members2, groups2;"
    );
  });

  describe("generates create statements", async () => {
    test("version 1", async () => {
      await getClient([Members, Groups]).generateMigration("init");

      expect(countMigrationFiles()).toEqual(1);

      validateLatestMigration("init.migration");
    });

    test("version 2", async () => {
      await getClient([Members2, Groups2]).generateMigration("init2");

      expect(countMigrationFiles()).toEqual(2);

      validateLatestMigration("init2.migration");
    });
  });

  describe("generates alter table statements", async () => {
    beforeAll(async () => {
      wipeMigrations();

      const DB = getClient([Members, Groups]);
      await DB.generateMigration("init");
      await DB.runMigrations();

      // Waiting 1s so timestamp on next migration is greater than this one xd
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    });

    test("alter", async () => {
      const DB = getClient([Members2, Groups2]);
      await DB.generateMigration("alter");

      expect(countMigrationFiles()).toEqual(2);

      validateLatestMigration("alter.migration");

      await DB.runMigrations();

      await DB.generateMigration("alter2");

      expect(countMigrationFiles()).toEqual(3);

      validateLatestMigration("empty.migration");
    });
  });
});
