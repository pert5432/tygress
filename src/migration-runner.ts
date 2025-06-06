import { PostgresConnection } from "./postgres-connection";
import * as fs from "fs";
import { Migration } from "./types";
import path from "path";

export class MigrationRunner {
  private migrationLogTablename: string = "tygress_migrations";

  private migrations: Migration[] = [];
  private migrationsMap: Map<string, Migration> = new Map();

  private executedMigrations: { name: string; executed_at: Date }[] = [];
  private executedMigrationsMap: Map<string, Date> = new Map();

  constructor(
    private conn: PostgresConnection,
    private migrationFolders: string[]
  ) {}

  async run(): Promise<void> {
    await this.ensureMigrationLogTable();
    await Promise.all([this.loadMigrations(), this.loadExecutedMigrations()]);

    const pendingMigrations = this.migrations.filter(
      (m) => !this.executedMigrationsMap.has(m.name)
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

  async rollback(): Promise<void> {
    await this.ensureMigrationLogTable();
    await Promise.all([this.loadMigrations(), this.loadExecutedMigrations()]);

    if (this.executedMigrations.length < 1) {
      console.log(`No executed migrations found, nothing to rollback`);
      return;
    }

    const lastExecutedMigration =
      this.executedMigrations[this.executedMigrations.length - 1]!;

    console.log(
      `Last executed migration is ${lastExecutedMigration.name}, executed at ${lastExecutedMigration.executed_at}`
    );

    const migration = this.migrationsMap.get(lastExecutedMigration.name);
    if (!migration) {
      throw new Error(
        `${lastExecutedMigration.name} is the last executed migration in the database but it was not found in the migration files`
      );
    }

    await this.conn.begin();
    try {
      await this.rollbackMigration(migration);

      await this.conn.commit();
    } catch (e) {
      console.log(`Rolling back migration failed`);

      await this.conn.rollback();

      throw e;
    }

    console.log(`Migration rolled back successfully`);
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

  private async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`Rolling back ${migration.name}`);

    await migration.down(this.conn);

    await this.conn.query(
      `DELETE FROM ${this.migrationLogTablename} WHERE name = $1`,
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

    this.migrations.sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  private async loadExecutedMigrations(): Promise<void> {
    this.executedMigrations = (
      await this.conn.query<{ name: string; executed_at: Date }>(
        `SELECT name, executed_at FROM ${this.migrationLogTablename} ORDER BY executed_at ASC`
      )
    ).rows;

    this.executedMigrationsMap = new Map(
      this.executedMigrations.map((e) => [e.name, e.executed_at])
    );
  }
}
