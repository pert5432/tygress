import { Column, OneToMany, PrimaryKey, Table, TygressEntity } from "../../";
import { PetCategoriesPet } from "./pet-categories-pet";

@Table("pet_categories")
export class PetCategories extends TygressEntity {
  @PrimaryKey("id")
  id: string;

  @Column("name")
  name: string;

  @OneToMany(() => PetCategoriesPet, "category")
  pets: PetCategoriesPet[];
}
