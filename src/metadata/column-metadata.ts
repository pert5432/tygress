import { PostgresDataType } from "../types/structure";
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
  dataType: PostgresDataType;

  nullable: boolean;

  default?: { type: "value" | "expression"; value: string };

  primaryKey: boolean;
}
