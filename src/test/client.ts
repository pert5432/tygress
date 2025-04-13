import { PostgresClient } from "../postgres-client";
import { Users } from "./entities/users";
import { Pets } from "./entities/pets";
import { PetCategories } from "./entities/pet-categories";
import { PetCategoriesPet } from "./entities/pet-categories-pet";

export const TEST_DB = new PostgresClient({
  databaseUrl: "postgres://petr@localhost:5437/tygress_test",
  ssl: false,
  entities: [Users, Pets, PetCategories, PetCategoriesPet],
});
