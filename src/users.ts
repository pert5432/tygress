import { Column } from "./decorators/column";
import { OneToMany } from "./decorators/one-to-many";
import { Table } from "./decorators/table";
import { Pets } from "./pets";

@Table("users")
export class Users {
  @Column("id")
  id: string;

  @Column("username")
  username: string;

  @Column("full_name")
  fullName: string;

  @OneToMany(Pets, "users")
  pets: Pets[];
}
