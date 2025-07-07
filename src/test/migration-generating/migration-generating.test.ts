import * as fs from "fs";
import { beforeAll, describe, expect, test } from "vitest";
import { getClient } from "./client";
import { countMigrationFiles } from "./count-migration-files";
import path from "path";
import { validateLatestMigration } from "./validate-latest-migration";
import { Members, Groups, Groups2, Members2 } from "./entities/";

describe("migration generation", async () => {
  // Recreate migrations folder after tests finish
  beforeAll(async () => {
    fs.rmSync(path.join(__dirname, "migrations"), {
      recursive: true,
      force: true,
    });

    fs.mkdirSync(path.join(__dirname, "migrations"));

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
});
