import { Entity } from "../entity";
import { PostgresDataType } from "../structure";

export type ColumnMetadataArgs = {
  // The class which the decorated field belongs to
  klass: Entity<unknown>;

  name: string;
  fieldName: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  dataType: PostgresDataType;

  nullable: boolean;

  default?: string;

  primaryKey?: boolean;
};
