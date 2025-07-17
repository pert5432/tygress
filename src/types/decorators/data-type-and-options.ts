import { OneOf } from "../one-of";
import { DataType } from "../structure";

export type ColumnDataTypeAndOptions =
  | { type: DataType }
  | OneOf<
      [
        {
          type:
            | "TIMESTAMP"
            | "TIMESTAMPTZ"
            | "TIMESTAMP WITH TIME ZONE"
            | "TIME"
            | "TIMETZ"
            | "TIME WITH TIME ZONE";
          precision?: number;
        },
        {
          type:
            | "BIT"
            | "BIT VARYING"
            | "VARBIT"
            | "CHARACTER"
            | "CHAR"
            | "CHARACTER VARYING"
            | "VARCHAR";
          maxLength?: number;
        },
        { type: "NUMERIC" | "DECIMAL"; precision?: number; scale?: number }
      ]
    >;
