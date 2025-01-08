import { Users } from "./users";
import { Column, Table, ManyToOne, PrimaryKey } from "../decorators";

@Table("pets")
export class Pets {
  @PrimaryKey("id")
  id: number;

  @Column("name")
  name: string;

  @ManyToOne(Users, "pets")
  user: Users;
}
