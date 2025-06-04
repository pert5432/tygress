import { ColumnDataTypeAndOptions } from "../types/decorators";
import { DataType, ColumnDefault } from "../types/structure";
import { TableMetadata } from "./table-metadata";

export class ColumnMetadata {
  name: string;
  fieldName: string;

  isArray: boolean = false;

  // Is set when table metadata is created
  table: TableMetadata;

  select: boolean;

  //
  // STRUCTURE
  //
  dataType: DataType;

  nullable: boolean;

  default?: ColumnDefault;

  precision?: number;

  scale?: number;

  maxLength?: number;

  primaryKey: boolean;
}
