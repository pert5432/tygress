import { PostgresClient } from "../";
import { Users } from "./entities/users";
import { Pets } from "./entities/pets";
import { PetCategories } from "./entities/pet-categories";
import { PetCategoriesPet } from "./entities/pet-categories-pet";
import path from "node:path";

export const TEST_DB = new PostgresClient({
  databaseUrl: process.env.DATABASE_URL!,
  ssl: false,
  entities: [Users, Pets, PetCategories, PetCategoriesPet],

  defaultConnectionOptions: {
    collectSql: true,
  },

  migrationFolders: [`${path.join(__dirname, "migrations")}`],
});
