export type NumericType =
  | "SMALLINT"
  | "INT2"
  | "INTEGER"
  | "INT"
  | "INT4"
  | "BIGINT"
  | "INT8";

export type TextType = "TEXT" | "CHARACTER VARYING" | "VARCHAR";

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

export type BlobType = "BYTEA";

export type PostgresDataType =
  | NumericType
  | TextType
  | BooleanType
  | JSONType
  | DateTimeType
  | UUIDType
  | BlobType;
