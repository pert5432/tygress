import { Relation } from "./enums/relation";
import { METADATA_STORE } from "./metadata-store";
import { Entity } from "./types/entity";

export class RelationMetadata {
  type: Relation;

  // This table has id
  primary: Entity<unknown>;
  // Which field the decorator is defined on
  primaryField: string;
  // Name of the column whic the FK points to (id by default)
  primaryKey: string;

  get fullPrimaryKey(): string {
    const primaryMeta = METADATA_STORE.getTable(this.primary);

    return `${primaryMeta.fullName}.${this.primaryKey}`;
  }

  // this table has other_id
  foreign: Entity<unknown>;
  // Which field the decorator is defined on
  foreignField: string;
  // The name of the FK column (other_id), inferred from foreignField by default
  foreignKey: string;

  get fullForeignKey(): string {
    const foreignMeta = METADATA_STORE.getTable(this.foreign);

    return `${foreignMeta.fullName}.${this.foreignKey}`;
  }
}
