import * as fs from "fs";
import { afterAll, describe, expect, test } from "vitest";
import { getClient } from "./client";
import { Members } from "./entities/members";
import { Groups } from "./entities/groups";
import { countMigrationFiles } from "./count-migration-files";
import path from "path";
import { validateLatestMigration } from "./validate-latest-migration";

describe("migration generation", async () => {
  // Recreate migrations folder after tests finish
  afterAll(() => {
    fs.rmSync(path.join(__dirname, "migrations"), {
      recursive: true,
      force: true,
    });

    fs.mkdirSync(path.join(__dirname, "migrations"));
  });

  test("generates create statements", async () => {
    const DB = getClient([Members, Groups]);

    await DB.generateMigration("init");

    expect(countMigrationFiles()).toEqual(1);

    validateLatestMigration("init.migration");
  });
});
