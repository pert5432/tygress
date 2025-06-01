import { DataType } from "../structure";

export type ColumnDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: DataType;

  nullable?: boolean;

  default?: (() => string) | T;
};
