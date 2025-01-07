import { Entity } from "../entity";

export type ColumnMetadataArgs = {
  // The class which the decorated field belongs to
  klass: Entity<unknown>;

  name: string;
  fieldName: string;

  select?: boolean;
};
