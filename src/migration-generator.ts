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
import { PostgresColumnDefinition, PostgresForeignKey } from "./types/postgres";
import { ColumnMetadataFactory } from "./factories";
import { QueryLogLevel, Relation } from "./enums";
import { Logger } from "./logger";

export class MigrationGenerator {
  private upStatements: string[] = [];
  private downStatements: string[] = [];

  private fullName: string;
  private filePath: string;

  private logger: Logger;

  constructor(
    private client: PostgresClient,
    private entities: AnEntity[],
    name: string,
    folder: string
  ) {
    const timestamp = new Date().getTime().toString().slice(0, -3);
    this.fullName = `${timestamp}${name}`;
    this.filePath = path.join(folder, `${this.fullName}.ts`);

    this.logger = new Logger(QueryLogLevel.DDL);
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

        await this.ensureForeignKeys(table);

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

      await this.ensureForeignKeys(table);
    }

    this.writeMigration();
  }

  //
  // PRIVATE
  //

  private async ensureForeignKeys(table: TableMetadata): Promise<void> {
    const pgForeignKeys = (await this.entityExists(table))
      ? await this.getTableForeignKeys(table)
      : [];
    const relations = METADATA_STORE.relations.filter(
      (r) => r.type === Relation.MANY_TO_ONE && r.foreign === table.klass
    );

    if (!pgForeignKeys.length && relations.length) {
      return;
    }

    const upBuilder = new AlterTableSqlBuilder(table);
    const downBuilder = new AlterTableSqlBuilder(table);

    // Create foreign keys that are missing in pg
    for (const relation of relations) {
      const primaryMeta = METADATA_STORE.getTable(relation.primary);

      const pgForeignKey = pgForeignKeys.find(
        (e) =>
          e.foreign_columns.length === 1 &&
          e.primary_columns.length === 1 &&
          e.foreign_table === table.tablename &&
          e.primary_table === primaryMeta.tablename &&
          e.foreign_columns[0] === relation.foreignColumn.name &&
          e.primary_columns[0] === relation.primaryColumn.name
      );

      // FK exists in pg, we continue
      if (pgForeignKey) {
        continue;
      }

      const fkName = `${table.tablename}_${relation.foreignField}_fk`;

      upBuilder.addFK(relation, fkName);
      downBuilder.dropFK(fkName);
    }

    if (upBuilder.hasChanges()) {
      this.upStatements.push(upBuilder.sql());
      this.downStatements.push(downBuilder.sql());
    }

    // We don't drop FKs that are in pg but not in entities
    // When a Tygress managed table gets dropped its FKs are dropped as well so that is not an issue
    // The reason is to not interfere with tables not managed by Tygress, yet ;)
  }

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
      await this.client.withConnection({ logger: this.logger }, (conn) =>
        conn.query(
          "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2",
          [table.schemaname ?? "public", table.tablename]
        )
      )
    ).rows.length;
  }

  private async getTableColumns(
    table: TableMetadata
  ): Promise<PostgresColumnDefinition[]> {
    return (
      await this.client.withConnection({ logger: this.logger }, (conn) =>
        conn.query<PostgresColumnDefinition>(
          "SELECT * FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
          [table.schemaname ?? "public", table.tablename]
        )
      )
    ).rows;
  }

  private async getTableForeignKeys(
    table: TableMetadata
  ): Promise<PostgresForeignKey[]> {
    return (
      await this.client.withConnection({ logger: this.logger }, (conn) =>
        conn.query<PostgresForeignKey>(
          `
      WITH constraint_data AS (
        SELECT 
          UNNEST(conkey) AS foreign_column,
          UNNEST(confkey) AS primary_column,
          conrelid AS foreign_table_oid,
          confrelid AS primary_table_oid,
          confupdtype AS on_update,
          confdeltype AS on_delete,
          conname AS name
        FROM pg_constraint
        
        WHERE
          contype = 'f' AND
          connamespace = $1::regnamespace::oid AND
          conrelid = $2::regclass::oid
      )

      SELECT 
        ARRAY_AGG(foreign_col.attname) AS foreign_columns,
        ARRAY_AGG(primary_col.attname) AS primary_columns,
        con.foreign_table_oid::regclass AS foreign_table,
        con.primary_table_oid::regclass AS primary_table,
        con.on_update,
        con.on_delete,
        con.name AS name
      FROM constraint_data con

      INNER JOIN pg_attribute foreign_col
        ON con.foreign_table_oid = foreign_col.attrelid
        AND con.foreign_column = foreign_col.attnum
        
      INNER JOIN pg_attribute primary_col
        ON con.primary_table_oid = primary_col.attrelid
        AND con.primary_column = primary_col.attnum

      GROUP BY con.foreign_table_oid, con.primary_table_oid, con.on_update, con.on_delete, con.name`,
          [table.schemaname ?? "public", table.tablename]
        )
      )
    ).rows;
  }

  private writeMigration(): void {
    const executeStatement = (statement: string) =>
      `${pad(1, `await conn.query(\`\n${pad(2, statement)}\`\n`)}${pad(
        1,
        ");"
      )}`;

    let contents = `import { PostgresConnection } from "tygress";\n\n`;
    contents += `export const name: string = "${this.fullName}";\n\n`;
    contents += `export const up = async (conn: PostgresConnection): Promise<void> => {\n${this.upStatements
      .map((s) => executeStatement(s))
      .join("\n\n")}\n};\n\n`;
    contents += `export const down = async (conn: PostgresConnection): Promise<void> => {\n${this.downStatements
      .toReversed()
      .map((s) => executeStatement(s))
      .join("\n\n")}\n};\n`;

    fs.writeFileSync(this.filePath, Buffer.from(contents));
  }
}
