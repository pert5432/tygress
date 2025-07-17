import { AnEntity } from "../entity";

export type TableMetadataArgs = {
  tablename: string;
  schemaname?: string;

  klass: AnEntity;
};
