import { Column, OneToMany, Table } from "../decorators";
import { Pets } from "./pets";

@Table("users")
export class Users {
  @Column("id")
  id: string;

  @Column("username")
  username: string;

  @Column("full_name")
  fullName: string;

  @OneToMany(Pets, "user")
  pets: Pets[];
}
