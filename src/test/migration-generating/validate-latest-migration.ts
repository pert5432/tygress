import { latestMigrationFileContent } from "./latest-migration-file-content";
import { expect } from "vitest";
import { targetMigrationContents } from "./target-migration-contents";

export const validateLatestMigration = (
  targetMigrationFilename: string
): void => {
  const latestMigration = latestMigrationFileContent();
  const targetMigration = targetMigrationContents(targetMigrationFilename);

  // Validate that 3rd line contains name of the migration (the particular name is dependent on current timestamp so we exclude it from the comparison)
  const nameLine = latestMigration.split("\n")[2]!;
  expect(nameLine.split('"')[0]).toEqual("export const name: string = ");
  expect(nameLine.split('"')[2]).toEqual(";");

  // Validate that rest of the migration file contains what is expected
  expect(latestMigration.split("\n").slice(4).join("\n")).toEqual(
    targetMigration.split("\n").slice(4).join("\n")
  );
};
