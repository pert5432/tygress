import { DataType, PostgresDataType } from "../types/structure";

export const dataTypesEqual = (
  type: DataType,
  pgType: PostgresDataType
): boolean => {
  const _type = type.toLowerCase();
  const _pgType = pgType.toLowerCase();

  return (
    _type.toLowerCase() === _pgType.toLowerCase() || aliasMap[_type] === _pgType
  );
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
