import { Column, ManyToOne, PrimaryKey, Table } from "../../..";
import { Groups2 } from "./groups2";

@Table("members")
export class Members2 {
  @PrimaryKey({ name: "id", type: "UUID", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ name: "username", type: "TEXT", default: "user", nullable: true })
  username: string;

  @Column({ name: "group_id", type: "BIGINT" })
  groupId: number;

  @ManyToOne(() => Groups2, "members", "groupId", {
    onDelete: "CASCADE",
  })
  group: Groups2;
}
