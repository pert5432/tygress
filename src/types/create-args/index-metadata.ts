import { AnEntity } from "../entity";

export type IndexMetadataArgs = {
  klass: AnEntity;

  name: string;

  columns: {
    fieldName: string;
    order?: "ASC" | "DESC";
    nulls?: "FIRST" | "LAST";
  }[];

  includeColumns?: string[];

  nullsDistinct?: boolean;
};
