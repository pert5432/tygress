import { Column, OneToMany, PrimaryKey, Table } from "../decorators";
import { Pets } from "./pets";

@Table("users")
export class Users {
  @PrimaryKey("id")
  id: number;

  @Column("username")
  username: string;

  @Column("full_name")
  fullName: string;

  @OneToMany(Pets, "user")
  pets: Pets[];
}
