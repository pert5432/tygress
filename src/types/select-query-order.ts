import { ColumnMetadata } from "../metadata";

export type SelectQueryOrder = {
  alias: string;

  column: ColumnMetadata;

  order: "ASC" | "DESC";
};
