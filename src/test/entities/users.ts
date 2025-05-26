import { Column, OneToMany, PrimaryKey, Table, TygressEntity } from "../../";
import { Pets } from "./pets";

@Table("users")
export class Users extends TygressEntity {
  @PrimaryKey("id")
  id: string;

  @Column("first_name")
  firstName: string;

  @Column("last_name")
  lastName: string;

  @Column("username")
  username: string;

  @Column("birthdate")
  birthdate: Date | null;

  @OneToMany(Pets, "user")
  pets: Pets[];
}
