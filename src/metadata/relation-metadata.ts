import { Relation } from "../enums";
import { Entity, RelationSide } from "../types";

export class RelationMetadata {
  type: Relation;

  // This table has id
  primary: Entity<unknown>;
  // Which field the decorator is defined on
  primaryField: string;
  // Name of the column whic the FK points to (id by default)
  primaryKey: string;

  // this table has other_id
  foreign: Entity<unknown>;
  // Which field the decorator is defined on
  foreignField: string;
  // The name of the FK column (other_id), inferred from foreignField by default
  foreignKey: string;

  public getOtherTable(table: Entity<unknown>): Entity<unknown> {
    return this.primary === table ? this.foreign : this.primary;
  }

  public getOtherSide(table: Entity<unknown>): RelationSide {
    return this.primary === table
      ? {
          field: this.foreignField,
          key: this.foreignKey,
          klass: this.foreign,
        }
      : {
          field: this.primaryField,
          key: this.primaryKey,
          klass: this.primary,
        };
  }
}
