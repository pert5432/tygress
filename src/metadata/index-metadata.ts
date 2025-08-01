import { AnEntity } from "../types";
import { IndexMethod } from "../types/structure";
import { IndexWheres } from "../types/where-args";
import { ColumnMetadata } from "./column-metadata";
import { IndexColumnMetadata } from "./index-column-metadata";
import { TableMetadata } from "./table-metadata";

export class IndexMetadata {
  table: TableMetadata;
  name: string;
  method: IndexMethod;

  keyColumns: IndexColumnMetadata[];

  includeColumns: ColumnMetadata[];

  unique: boolean;

  nullsDistinct?: boolean;

  where?: IndexWheres<InstanceType<AnEntity>>;
}
