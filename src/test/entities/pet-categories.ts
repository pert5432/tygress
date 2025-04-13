import { Column, OneToMany, PrimaryKey, Table } from "../../decorators";
import { PetCategoriesPet } from "./pet-categories-pet";

@Table("pet_categories")
export class PetCategories {
  @PrimaryKey("id")
  id: string;

  @Column("name")
  name: string;

  @OneToMany(PetCategoriesPet, "category")
  pets: PetCategoriesPet[];
}
