import { Users } from "./users";
import { Column, Table, ManyToOne, PrimaryKey } from "../decorators";

@Table("pets")
export class Pets {
  @PrimaryKey("id")
  id: number;

  @Column("name")
  name: string;

  @Column("user_id")
  userId: number;

  @ManyToOne(Users, "pets")
  user: Users;
}
