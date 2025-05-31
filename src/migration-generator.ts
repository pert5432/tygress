import * as fs from "fs";
import path from "node:path";
import { PostgresClient } from "./postgres-client";
import { AnEntity } from "./types";
import { CreateTableSqlBuilder } from "./sql-builders/structure";
import { METADATA_STORE, TableMetadata } from "./metadata";
import { pad } from "./utils";

export class MigrationGenerator {
  private upStatements: string[] = [];
  private downStatements: string[] = [];

  private fullName: string;
  private filePath: string;

  constructor(
    private client: PostgresClient,
    private entities: AnEntity[],
    name: string,
    folder: string
  ) {
    const timestamp = new Date().getTime().toString().slice(0, -3);
    this.fullName = `${timestamp}${name}`;
    this.filePath = path.join(folder, `${this.fullName}.ts`);
  }

  async createBlank(): Promise<void> {
    this.writeFile();
  }

  async generate(): Promise<void> {
    for (const entity of this.entities.map((e) => METADATA_STORE.getTable(e))) {
      if (!(await this.entityExists(entity))) {
        this.upStatements.push(new CreateTableSqlBuilder(entity).sql());
      }
    }

    this.writeFile();
  }

  private async entityExists(entity: TableMetadata): Promise<boolean> {
    return !!(
      await this.client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
        [entity.schemaname ?? "public", entity.tablename]
      )
    ).rows.length;
  }

  private writeFile(): void {
    const executeStatement = (statement: string) =>
      `await conn.query(\`\n${pad(2, statement)}\`\n  );`;

    let contents = `import { PostgresConnection } from "tygress";\n\n`;
    contents += `export const name: string = "${this.fullName}";\n\n`;
    contents += `export const up = async (conn: PostgresConnection): Promise<void> => {\n${this.upStatements
      .map((s) => executeStatement(s))
      .join("\n")}\n};\n\n`;
    contents += `export const down = async (conn: PostgresConnection): Promise<void> => {\n${this.downStatements
      .map((s) => executeStatement(s))
      .join("\n")}\n};\n`;

    fs.writeFileSync(this.filePath, Buffer.from(contents));
  }
}
