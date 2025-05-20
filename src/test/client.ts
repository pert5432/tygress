import { PostgresClient } from "../";
import { Users } from "./entities/users";
import { Pets } from "./entities/pets";
import { PetCategories } from "./entities/pet-categories";
import { PetCategoriesPet } from "./entities/pet-categories-pet";

export const TEST_DB = new PostgresClient({
  databaseUrl: process.env.DATABASE_URL!,
  ssl: false,
  entities: [Users, Pets, PetCategories, PetCategoriesPet],

  defaultConnectionOptions: {
    collectSql: true,
  },
});
