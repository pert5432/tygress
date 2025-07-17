#!/usr/bin/env npx tsx

import { ParseArgsConfig, parseArgs } from "node:util";
import { PostgresClient } from "./postgres-client";
import * as fs from "fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const argsOptions: ParseArgsConfig["options"] = {
  config: {
    type: "string",
  },
  name: {
    type: "string",
  },
};

abstract class CLI {
  private static defaultClientFilename = "tygress-client.ts";

  static async run(argv: string[]) {
    const args = parseArgs<{}>({
      options: argsOptions,
      allowPositionals: true,
      args: argv,
    });

    const command = args.positionals[0];
    if (!command?.length) {
      console.log(`
        CLI usage is 'tygress [command] --options'
        
        command is one of: migration:blank, migration:generate, migration:run, migration:rollback
        `);

      return;
    }

    const client = await this.getPostgresClient(args.values.config as string);

    switch (command) {
      case "migration:run":
        await client.runMigrations();
        break;
      case "migration:rollback":
        await client.rollbackLastMigration();
        break;
      case "migration:blank":
      case "migration:generate": {
        const name = (args.values.name as string) ?? args.positionals[1];

        if (!name) {
          throw new Error(
            `You need to supply a name when generating a migration`
          );
        }

        switch (command) {
          case "migration:blank":
            await client.createBlankMigration(name);
            break;
          case "migration:generate":
            await client.generateMigration(name);
            break;
        }
        break;
      }

      default:
        throw new Error(`Unknown command ${command}`);
    }

    await client.close();
  }

  private static async getPostgresClient(
    clientFilename?: string
  ): Promise<PostgresClient> {
    const paths = [clientFilename, this.defaultClientFilename].filter(
      (e) => !!e?.length
    ) as string[];

    for (const filename of paths) {
      const filepath = path.join(".", filename);

      if (!fs.existsSync(filepath)) {
        continue;
      }

      const module = await import(pathToFileURL(path.resolve(filepath)).href);

      return module.default as PostgresClient;
    }

    throw new Error(
      `No client config for migrations found, looked in these files: ${paths.join(
        ", "
      )}`
    );
  }
}

CLI.run(process.argv.slice(2));
