import { ColumnMetadata } from "../metadata";

export type SelectQueryTarget = {
  alias: string;

  column: ColumnMetadata;

  as?: string;
};
