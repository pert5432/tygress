import { ColumnDataTypeAndOptions } from "./data-type-and-options";

export type PrimaryKeyDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  default?: (() => string) | T;
} & ColumnDataTypeAndOptions;
