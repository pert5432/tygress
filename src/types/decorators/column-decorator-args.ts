import { PostgresDataType } from "../structure";

export type ColumnDecoratorArgs = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: PostgresDataType;

  nullable?: boolean;

  default?: string;
};
