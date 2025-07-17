import { Column, OneToMany, PrimaryKey, Table } from "../../..";
import { Members } from "./members";

@Table("groups")
export class Groups {
  @PrimaryKey({ name: "id", type: "INT" })
  id: number;

  @Column({ name: "name", type: "VARCHAR", maxLength: 256 })
  name: string;

  @OneToMany(() => Members, "group")
  members: Members[];
}
