import { Relation } from "./enums/relation";
import { METADATA_STORE } from "./metadata-store";
import { Entity } from "./types/entity";

export class RelationMetadata {
  type: Relation;

  // This table has id
  primary: Entity<unknown>;
  primaryField: string;
  primaryKey: string;

  get fullPrimaryKey(): string {
    const primaryMeta = METADATA_STORE.getTable(this.primary);

    return `${primaryMeta.fullName}.${this.primaryKey}`;
  }

  // this table has other_id
  foreign: Entity<unknown>;
  foreignField: string;
  foreignKey: string;

  get fullForeignKey(): string {
    const foreignMeta = METADATA_STORE.getTable(this.foreign);

    return `${foreignMeta.fullName}.${this.foreignKey}`;
  }
}
