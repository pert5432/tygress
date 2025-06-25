import { Relation } from "../enums";
import { AnEntity } from "../types";
import { ReferentialAction } from "../types/structure";
import { ColumnMetadata } from "./column-metadata";
import { METADATA_STORE } from "./metadata-store";

export class RelationMetadata {
  type: Relation;

  // This table has id
  primary: AnEntity;
  // Which field the decorator is defined on
  primaryField: string;
  // Name of the column whic the FK points to (id by default)
  primaryKey: string;

  get primaryColumn(): ColumnMetadata {
    return METADATA_STORE.getColumn(this.primary, this.primaryKey);
  }

  // this table has other_id
  foreign: AnEntity;
  // Which field the decorator is defined on
  foreignField: string;
  // The name of the FK column (other_id), inferred from foreignField by default
  foreignKey: string;

  get foreignColumn(): ColumnMetadata {
    return METADATA_STORE.getColumn(this.foreign, this.foreignKey);
  }

  onDelete: ReferentialAction;
  onUpdate: ReferentialAction;

  public getOtherTable(table: AnEntity): AnEntity {
    return this.primary === table ? this.foreign : this.primary;
  }
}
