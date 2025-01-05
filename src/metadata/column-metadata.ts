import { TableMetadata } from "./table-metadata";

export class ColumnMetadata {
  name: string;
  fieldName: string;

  // Is set when table metadata is created
  table?: TableMetadata;

  select: boolean;
}
