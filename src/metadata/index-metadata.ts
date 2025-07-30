import { ColumnMetadata } from "./column-metadata";
import { IndexColumnMetadata } from "./index-column-metadata";
import { TableMetadata } from "./table-metadata";

export class IndexMetadata {
  table: TableMetadata;
  name: string;

  keyColumns: IndexColumnMetadata[];

  includeColumns: ColumnMetadata[];

  unique: boolean;

  nullsDistinct?: boolean;
}
