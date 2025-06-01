import { PostgresDataType } from "../structure";

export type PostgresColumnDefinition = {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: string;
  is_nullable: "NO" | "YES";
  data_type: PostgresDataType;
  character_maximum_length: number | null;
  character_octet_length: number | null;
  numeric_precision: number | null;
  numeric_precision_radix: number | null;
  numeric_scale: number | null;
  datetime_precision: number | null;
  interval_type: number | null;
  interval_precision: number | null;
};
