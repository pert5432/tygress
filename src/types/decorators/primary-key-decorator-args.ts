import { PostgresDataType } from "../structure";

export type PrimaryKeyDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: PostgresDataType;

  default?: (() => string) | T;
};
