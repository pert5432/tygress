import { Column, OneToMany, PrimaryKey, Table, TygressEntity } from "../../";
import { Pets } from "./pets";

@Table("users")
export class Users extends TygressEntity {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "first_name", type: "TEXT" })
  firstName: string;

  @Column({ name: "last_name", type: "TEXT" })
  lastName: string;

  @Column({ name: "username", type: "TEXT" })
  username: string;

  @Column({ name: "birthdate", type: "TIMESTAMPTZ", nullable: true })
  birthdate: Date | null;

  @OneToMany(Pets, "user")
  pets: Pets[];
}
