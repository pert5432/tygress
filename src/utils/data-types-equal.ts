import { ColumnMetadata } from "../metadata";
import { PostgresColumnDefinition } from "../types/postgres";
import { PostgresDataType } from "../types/structure";

export const dataTypesEqual = (
  column: ColumnMetadata,
  pgColumn: PostgresColumnDefinition
): boolean => {
  const type = column.dataType.toLowerCase();
  const pgType = pgColumn.data_type.toLowerCase() as PostgresDataType;

  // Compare if the data type names match, taking type aliases into account
  if (type === pgType || aliasMap[type] === pgType) {
    // Compare if all the column details (precision, scale, maxLength) match
    return (
      !typesWithParams.has(pgType) ||
      ([
        pgColumn.numeric_precision,
        pgColumn.datetime_precision,
        pgColumn.interval_precision,
      ].includes(column.precision ?? null) &&
        (pgColumn.numeric_scale ?? null) === (column.scale ?? null) &&
        (pgColumn.character_maximum_length ?? null) ===
          (column.maxLength ?? null))
    );
  }

  return false;
};

// Maps type aliases to proper type names
const aliasMap: { [key: string]: PostgresDataType } = {
  int8: "bigint",
  serial8: "bigserial",
  varbit: "bit varying",
  bool: "boolean",
  char: "character",
  varchar: "character varying",
  float8: "double precision",
  int: "integer",
  int4: "integer",
  decimal: "numeric",
  float4: "real",
  int2: "smallint",
  serial2: "smallserial",
  serial4: "serial",
  timetz: "time with time zone",
  timestamptz: "timestamp with time zone",
} as const;

const typesWithParams = new Set<PostgresDataType>([
  "bit",
  "bit varying",
  "character",
  "character varying",
  "interval",
  "numeric",
  "time",
  "time with time zone",
  "timestamp",
  "timestamp with time zone",
]);
