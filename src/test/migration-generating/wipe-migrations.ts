import path from "path";
import * as fs from "fs";

export const wipeMigrations = (): void => {
  fs.rmSync(path.join(__dirname, "migrations"), {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(path.join(__dirname, "migrations"));
};
