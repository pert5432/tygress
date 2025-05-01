import { Column, ManyToOne, PrimaryKey, Table } from "../../";
import { PetCategories } from "./pet-categories";
import { Pets } from "./pets";

@Table("pet_categories_pet")
export class PetCategoriesPet {
  @PrimaryKey("id")
  id: string;

  @Column("pet_id")
  petId: string;

  @Column("pet_category_id")
  petCategoryId: string;

  @ManyToOne(Pets, "categories", "petId")
  pet: Pets;

  @ManyToOne(PetCategories, "pets", "petCategoryId")
  category: PetCategories;
}
