import { ColumnMetadata } from "./column-metadata";

export class IndexColumnMetadata {
  column?: ColumnMetadata;

  expression?: string;

  order?: "ASC" | "DESC";

  nulls?: "FIRST" | "LAST";
}
