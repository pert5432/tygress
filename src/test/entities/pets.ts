import {
  Column,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Table,
  TygressEntity,
} from "../../";
import { PetCategoriesPet } from "./pet-categories-pet";
import { PetMeta } from "./pet-meta";
import { Users } from "./users";

@Table("pets")
export class Pets extends TygressEntity {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "user_id", type: "UUID" })
  userId: string;

  @Column({ name: "name", type: "TEXT" })
  name: string;

  @Column({ name: "meta", type: "JSONB" })
  meta: PetMeta;

  @Column({ name: "image", type: "BYTEA" })
  image: Buffer;

  // RELATIONS

  @ManyToOne(() => Users, "pets", "userId")
  user: Users;

  @OneToMany(() => PetCategoriesPet, "pet")
  categories: PetCategoriesPet[];
}
