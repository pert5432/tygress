import { Column, ManyToOne, PrimaryKey, Table } from "../../..";
import { Groups } from "./groups";

@Table("members")
export class Members {
  @PrimaryKey({ name: "id", type: "UUID", default: () => "gen_random_uuid()" })
  id: string;

  @Column({ name: "username", type: "TEXT", nullable: false })
  username: string;

  @Column({ name: "group_id", type: "INT" })
  groupId: number;

  @ManyToOne(() => Groups, "members", "groupId", {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  group: Groups;
}
