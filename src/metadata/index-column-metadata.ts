import { ColumnMetadata } from "./column-metadata";

export class IndexColumnMetadata {
  column: ColumnMetadata;

  order?: "ASC" | "DESC";

  nulls?: "FIRST" | "LAST";
}
