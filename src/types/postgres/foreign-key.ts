import { PostgresFKAction } from "../structure";

export type PostgresForeignKey = {
  name: string;

  foreign_table: string;
  primary_table: string;

  foreign_columns: string[];
  primary_columns: string[];

  on_delete: PostgresFKAction;
  on_update: PostgresFKAction;
};
