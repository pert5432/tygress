import { Column, ManyToOne, PrimaryKey, Table, TygressEntity } from "../../";
import { PetCategories } from "./pet-categories";
import { Pets } from "./pets";

@Table("pet_categories_pet")
export class PetCategoriesPet extends TygressEntity {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "pet_id", type: "TEXT" })
  petId: string;

  @Column({ name: "pet_category_id", type: "TEXT" })
  petCategoryId: string;

  @ManyToOne(() => Pets, "categories", "petId")
  pet: Pets;

  @ManyToOne(() => PetCategories, "pets", "petCategoryId")
  category: PetCategories;
}
