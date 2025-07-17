import { Column, OneToMany, PrimaryKey, Table } from "../../..";
import { Members2 } from "./members2";

@Table("groups")
export class Groups2 {
  @PrimaryKey({ name: "id", type: "BIGINT" })
  id: number;

  @Column({ name: "name", type: "TEXT" })
  name: string;

  @OneToMany(() => Members2, "group")
  members: Members2[];
}
