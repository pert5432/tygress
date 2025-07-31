import { AnEntity } from "../entity";
import { IndexMethod } from "../structure";

export type IndexMetadataArgs = {
  klass: AnEntity;

  name: string;

  columns: {
    fieldName: string;
    order?: "ASC" | "DESC";
    nulls?: "FIRST" | "LAST";
  }[];

  includeColumns?: string[];

  unique?: boolean;
  nullsDistinct?: boolean;
  method?: IndexMethod;
};
