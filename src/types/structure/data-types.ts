export type NumericType =
  | "SMALLINT"
  | "INT2"
  | "INTEGER"
  | "INT"
  | "INT4"
  | "BIGINT"
  | "INT8"
  | "NUMERIC"
  | "DECIMAL";

export type TextType =
  | "TEXT"
  | "CHARACTER VARYING"
  | "VARCHAR"
  | "CHAR"
  | "CHARACTER";

export type BooleanType = "BOOLEAN" | "BOOL";

export type JSONType = "JSONB" | "JSON";

export type DateTimeType =
  | "TIME"
  | "TIME WITHOUT TIME ZONE"
  | "TIME WITH TIME ZONE"
  | "TIMETZ"
  | "TIMESTAMP"
  | "TIMESTAMP WITHOUT TIMEZONE"
  | "TIMESTAMP WITH TIMEZONE"
  | "TIMESTAMPTZ";

export type UUIDType = "UUID";

export type BinaryTypes = "BYTEA" | "BIT" | "BIT VARYING" | "VARBIT";

export type DataType =
  | NumericType
  | TextType
  | BooleanType
  | JSONType
  | DateTimeType
  | UUIDType
  | BinaryTypes;
