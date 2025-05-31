import { Column, OneToMany, PrimaryKey, Table, TygressEntity } from "../../";
import { PetCategoriesPet } from "./pet-categories-pet";

@Table("pet_categories")
export class PetCategories extends TygressEntity {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "name", type: "TEXT" })
  name: string;

  @OneToMany(PetCategoriesPet, "category")
  pets: PetCategoriesPet[];
}
