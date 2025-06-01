import { DataType } from "../structure";

export type PrimaryKeyDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: DataType;

  default?: (() => string) | T;
};
