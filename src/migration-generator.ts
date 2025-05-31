import * as fs from "fs";
import path from "node:path";
import { PostgresClient } from "./postgres-client";
import { AnEntity } from "./types";
import {
  AlterTableSqlBuilder,
  CreateTableSqlBuilder,
} from "./sql-builders/structure";
import { METADATA_STORE, TableMetadata } from "./metadata";
import { pad } from "./utils";
import { PostgresColumnDefinition } from "./types/postgres";

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
    this.writeMigration();
  }

  async generate(): Promise<void> {
    for (const table of this.entities.map((e) => METADATA_STORE.getTable(e))) {
      // Create entire table if it doesn't exist
      if (!(await this.entityExists(table))) {
        this.upStatements.push(new CreateTableSqlBuilder(table).sql());
        // TODO: Generate down statement
        continue;
      }

      const upBuilder = new AlterTableSqlBuilder(table);
      const postgresColumns = await this.getTableColumns(table);

      // Adding columns that are not in Postgres
      for (const column of table.columns) {
        const postgresColumn = postgresColumns.find(
          (pc) => pc.column_name === column.name
        );

        // Column does not exists in Postgres
        if (!postgresColumn) {
          // TODO: Generate down statement
          upBuilder.addColumn(column);
        }
        // TODO: handle differences in column details (type, default, null)
      }

      // Dropping columns that are not in our entities
      for (const postgresColumn of postgresColumns) {
        const column = table.columns.find(
          (c) => c.name === postgresColumn.column_name
        );

        // Column does not exists in our entity but exists in db
        if (!column) {
          // TODO: Generate down statement
          upBuilder.dropColumn(postgresColumn.column_name);
        }
      }

      if (upBuilder.hasChanges()) {
        this.upStatements.push(upBuilder.sql());
      }
    }

    this.writeMigration();
  }

  private async entityExists(table: TableMetadata): Promise<boolean> {
    return !!(
      await this.client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
        [table.schemaname ?? "public", table.tablename]
      )
    ).rows.length;
  }

  private async getTableColumns(
    table: TableMetadata
  ): Promise<PostgresColumnDefinition[]> {
    return (
      await this.client.query<PostgresColumnDefinition>(
        "SELECT * FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
        [table.schemaname ?? "public", table.tablename]
      )
    ).rows;
  }

  private writeMigration(): void {
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
