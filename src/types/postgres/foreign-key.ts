export type PostgresForeignKey = {
  name: string;

  foreign_table: string;
  primary_table: string;

  foreign_columns: string[];
  primary_columns: string[];

  // a = no action, r = restrict, c = cascade, n = set null, d = set default
  on_delete: "a" | "r" | "c" | "n" | "d";
  on_update: "a" | "r" | "c" | "n" | "d";
};
