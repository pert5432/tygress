import * as fs from "fs";
import path from "path";

export const targetMigrationContents = (filename: string): string =>
  fs
    .readFileSync(path.join(__dirname, "target-migrations", filename))
    .toString();
