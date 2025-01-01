import { Users } from "./users";
import { Column } from "./decorators/column";
import { ManyToOne } from "./decorators/many-to-one";
import { Table } from "./decorators/table";

@Table("pets")
export class Pets {
  @Column("id")
  id: string;

  @Column("name")
  name: string;

  @ManyToOne(Users, "pets")
  user: Users;
}
