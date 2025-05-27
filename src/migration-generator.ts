import * as fs from "fs";
import path from "node:path";

export class MigrationGenerator {
  async createBlank(name: string, folder: string): Promise<void> {
    const timestamp = new Date().getTime().toString().slice(0, -3);
    const fullName = `${timestamp}${name}`;

    let contents = `import { PostgresConnection } from "tygress";\n\n`;
    contents += `export const name: string = "${fullName}";\n\n`;
    contents += `export const up = async (conn: PostgresConnection): Promise<void> => {};\n\n`;
    contents += `export const down = async (conn: PostgresConnection): Promise<void> => {};\n`;

    fs.writeFileSync(
      path.join(folder, `${fullName}.ts`),
      Buffer.from(contents)
    );
  }
}
