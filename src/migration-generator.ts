import * as fs from "fs";
import path from "node:path";
import { PostgresClient } from "./postgres-client";
import { AnEntity } from "./types";
import {
  AlterTableSqlBuilder,
  CreateTableSqlBuilder,
  DropTableSqlBuilder,
} from "./sql-builders/structure";
import { ColumnMetadata, METADATA_STORE, TableMetadata } from "./metadata";
import { dataTypesEqual, pad, parsePgColumnDefault } from "./utils";
import { PostgresColumnDefinition } from "./types/postgres";
import { ColumnMetadataFactory } from "./factories";

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

        this.downStatements.push(
          new DropTableSqlBuilder(table.tablename).sql()
        );

        continue;
      }

      //
      // Resolve possible differences in the table
      //

      const upBuilder = new AlterTableSqlBuilder(table);
      const downBuilder = new AlterTableSqlBuilder(table);
      const postgresColumns = await this.getTableColumns(table);

      // Adding columns that are not in Postgres
      for (const column of table.columns) {
        const pgColumn = postgresColumns.find(
          (pc) => pc.column_name === column.name
        );

        // Column does not exists in Postgres
        if (!pgColumn) {
          upBuilder.addColumn(column);

          downBuilder.dropColumn(column.name);
        } else {
          this.handleColumnParameterDiff(
            column,
            pgColumn,
            upBuilder,
            downBuilder
          );
        }
      }

      // Dropping columns that are not in our entities
      for (const postgresColumn of postgresColumns) {
        const column = table.columns.find(
          (c) => c.name === postgresColumn.column_name
        );

        // Column does not exists in our entity but exists in db
        if (!column) {
          upBuilder.dropColumn(postgresColumn.column_name);

          downBuilder.addColumn(
            ColumnMetadataFactory.fromPGColumn(postgresColumn)
          );
        }
      }

      if (upBuilder.hasChanges()) {
        this.upStatements.push(upBuilder.sql());
        this.downStatements.push(downBuilder.sql());
      }
    }

    this.writeMigration();
  }

  //
  // PRIVATE
  //

  private handleColumnParameterDiff(
    column: ColumnMetadata,
    pgColumn: PostgresColumnDefinition,
    upBuilder: AlterTableSqlBuilder,
    downBuilder: AlterTableSqlBuilder
  ): void {
    if (!dataTypesEqual(column, pgColumn)) {
      upBuilder.setDataType(column);
      downBuilder.setDataType(ColumnMetadataFactory.fromPGColumn(pgColumn));
    }

    if (column.nullable !== (pgColumn.is_nullable === "YES")) {
      if (column.nullable) {
        upBuilder.dropNotNull(column);
        downBuilder.setNotNull(column);
      } else {
        upBuilder.setNotNull(column);
        downBuilder.dropNotNull(column);
      }
    }

    // Default in entity
    if (column.default) {
      // But not in PG
      if (!pgColumn.column_default) {
        upBuilder.setDefault(column);
        upBuilder.dropDefault(column);
      } else {
        const pgDefault = parsePgColumnDefault(pgColumn.column_default);

        // Default in PG but different
        if (
          !(
            column.default.type === pgDefault.type &&
            column.default.value === pgDefault.value
          )
        ) {
          upBuilder.setDefault(column);
          upBuilder.setDefault(ColumnMetadataFactory.fromPGColumn(pgColumn));
        }
      }
      // Default in PG but not in entity
    } else {
      if (pgColumn.column_default) {
        upBuilder.dropDefault(column);
        downBuilder.setDefault(ColumnMetadataFactory.fromPGColumn(pgColumn));
      }
    }
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
      `  await conn.query(\`\n${pad(2, statement)}\`\n  );`;

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
