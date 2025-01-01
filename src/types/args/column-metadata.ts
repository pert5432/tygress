import { Entity } from "../entity";

export type ColumnMetadataArgs = {
  name: string;

  fieldName: string;

  // The class which the decorated field belongs to
  klass: Entity<unknown>;
};
