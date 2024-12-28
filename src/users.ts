import { Column } from "./decorators/column";
import { Table } from "./decorators/table";

@Table("users")
export class Users {
  @Column("id")
  id: string;

  @Column("username")
  username: string;

  @Column("full_name")
  fullName: string;
}
