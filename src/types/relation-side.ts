import { Entity } from "./entity";

export type RelationSide = {
  klass: Entity<unknown>;
  field: string;
  key: string;
};
