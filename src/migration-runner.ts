import { PostgresConnection } from "./postgres-connection";
import * as fs from "fs";
import { Migration } from "./types";
import path from "path";

export class MigrationRunner {
  private migrationLogTablename: string = "tygress_migrations";

  private migrations: Migration[] = [];
  private migrationsMap: Map<string, Migration> = new Map();

  private executedMigrations: Set<string> = new Set();

  constructor(
    private conn: PostgresConnection,
    private migrationFolders: string[]
  ) {}

  async run() {
    await this.ensureMigrationLogTable();
    await Promise.all([this.loadMigrations(), this.loadExecutedMigrations()]);

    const pendingMigrations = this.migrations.filter(
      (m) => !this.executedMigrations.has(m.name)
    );

    console.log(`There are ${pendingMigrations.length} pending migrations`);

    if (pendingMigrations.length < 1) {
      return;
    }

    await this.conn.begin();

    try {
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      await this.conn.commit();
    } catch (e) {
      await this.conn.rollback();

      console.log(`Error running migrations, rolling back`);

      throw e;
    }

    console.log(`Migrations executed successfully`);
  }

  private async executeMigration(migration: Migration): Promise<void> {
    console.log(`Executing ${migration.name}`);

    await migration.up(this.conn);

    await this.conn.query(
      `INSERT INTO ${this.migrationLogTablename} (name, executed_at) VALUES ($1, NOW())`,
      [migration.name]
    );

    console.log("----------------------------------------");
  }

  private async ensureMigrationLogTable(): Promise<void> {
    const { rows } = await this.conn.query(
      `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
      ["public", this.migrationLogTablename]
    );

    if (rows.length > 0) {
      return;
    }

    console.log(`Creating migration log table ${this.migrationLogTablename}`);

    await this.conn.query(`
      CREATE TABLE ${this.migrationLogTablename} (
        name TEXT NOT NULL UNIQUE,
        executed_at timestamptz
      )`);
  }

  private async loadMigrations(): Promise<void> {
    // Collect all migrations in all specified folders
    for (const folderPath of this.migrationFolders) {
      const filenames = fs.readdirSync(folderPath);

      for (const filename of filenames) {
        if (!["ts", "js"].includes(filename.split(".").slice(-1)[0] ?? "")) {
          console.log(`${filename} is not a .ts or .js file, ignoring`);
        }

        const migration: Migration = await import(
          path.join(folderPath, filename)
        );

        if (!migration.name || !migration.up || !migration.down) {
          throw new Error(`${filename} contains an invalid migration`);
        }

        if (this.migrationsMap.has(migration.name)) {
          throw new Error(
            `Found duplicit migrations with name ${migration.name}`
          );
        }

        this.migrations.push(migration);
        this.migrationsMap.set(migration.name, migration);
      }
    }

    this.migrations.sort((a, b) => (a.name > b.name ? -1 : 1));
  }

  private async loadExecutedMigrations(): Promise<void> {
    this.executedMigrations = new Set(
      (
        await this.conn.query<{ name: string }>(
          `SELECT name FROM ${this.migrationLogTablename}`
        )
      ).rows.map((e) => e.name)
    );
  }
}
