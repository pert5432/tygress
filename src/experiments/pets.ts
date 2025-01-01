import { Users } from "./users";
import { Column, Table, ManyToOne } from "../decorators";

@Table("pets")
export class Pets {
  @Column("id")
  id: number;

  @Column("name")
  name: string;

  @ManyToOne(Users, "pets")
  user: Users;
}
