import path from "path";
import * as fs from "fs";

export const countMigrationFiles = (): number =>
  fs.readdirSync(path.join(__dirname, "migrations")).length;
