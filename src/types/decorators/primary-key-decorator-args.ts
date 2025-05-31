import { PostgresDataType } from "../structure";

export type PrimaryKeyDecoratorArgs = {
  name: string;

  select?: boolean;

  //
  // STRUCTURE
  //
  type: PostgresDataType;

  default?: string;
};
