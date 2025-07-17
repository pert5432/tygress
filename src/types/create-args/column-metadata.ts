import { AnEntity } from "../entity";
import { DataType } from "../structure";

export type ColumnMetadataArgs<T> = {
  // The class which the decorated field belongs to
  klass: AnEntity;

  name: string;
  fieldName: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  dataType: DataType;

  nullable: boolean;

  default?: (() => string) | T;

  primaryKey?: boolean;

  precision?: number;

  scale?: number;

  maxLength?: number;
};
