import { Entity } from "../entity";

export type TableMetadataArgs = {
  tablename: string;
  schemaname?: string;

  klass: Entity<unknown>;
};
