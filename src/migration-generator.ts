import * as fs from "fs";
import path from "node:path";
import { PostgresClient } from "./postgres-client";
import { AnEntity } from "./types";
import { CreateTableSqlBuilder } from "./sql-builders/structure";
import { METADATA_STORE } from "./metadata";

export class MigrationGenerator {
  constructor(private client: PostgresClient, private entities: AnEntity[]) {}

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

  async generate(): Promise<void> {
    for (const entity of this.entities) {
      console.log(
        new CreateTableSqlBuilder(METADATA_STORE.getTable(entity)).sql()
      );
    }
  }
}
