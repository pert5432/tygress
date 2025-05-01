import { Column, ManyToOne, OneToMany, PrimaryKey, Table } from "../../";
import { PetCategoriesPet } from "./pet-categories-pet";
import { Users } from "./users";

@Table("pets")
export class Pets {
  @PrimaryKey("id")
  id: string;

  @Column("user_id")
  userId: string;

  @Column("name")
  name: string;

  @ManyToOne(Users, "pets", "userId")
  user: Users;

  @OneToMany(PetCategoriesPet, "pet")
  categories: PetCategoriesPet[];
}
