import { PostgresDataType } from "../structure";

export type ColumnDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: PostgresDataType;

  nullable?: boolean;

  default?: (() => string) | T;
};
