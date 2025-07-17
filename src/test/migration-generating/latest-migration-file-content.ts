import * as fs from "fs";
import path from "path";

export const latestMigrationFileContent = (): string => {
  const filename = fs
    .readdirSync(path.join(__dirname, "migrations"))
    .sort((a, b) => (a > b ? -1 : 1))[0]!;

  return fs
    .readFileSync(path.join(__dirname, "migrations", filename))
    .toString();
};
