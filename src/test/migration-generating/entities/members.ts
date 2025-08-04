import {
  Column,
  ManyToOne,
  PrimaryKey,
  Table,
  Index,
  Gte,
  And,
  NotEq,
} from "../../..";
import { Groups } from "./groups";

@Table("members")
@Index("members_username_unique", {
  columns: ["username"],
  unique: true,
  nullsDistinct: true,
})
@Index("members_main", {
  columns: ["id"],
  includeColumns: ["username", "groupId"],
})
@Index("members_group_id_brin", {
  columns: ["groupId"],
  method: "brin",
  where: { groupId: And([Gte(5), NotEq(15)]), username: NotEq("admin") },
})
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
