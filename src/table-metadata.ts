import { ColumnMetadata } from "./column-metadata";
import { Entity } from "./types/entity.type";

export type TableMetadata = {
  tablename: string;
  className: string;
  class: Entity<unknown>;

  schemaname?: string;

  columns: ColumnMetadata[];
};
