import { ColumnDataTypeAndOptions } from "./";

export type ColumnDecoratorArgs<T> = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //

  nullable?: boolean;

  default?: (() => string) | T;
} & ColumnDataTypeAndOptions;
