import { Entity } from "./entity";

// Represents one side of a relation
export type RelationSide = {
  klass: Entity<unknown>;
  field: string;
  key: string;
};
