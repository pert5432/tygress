import { IndexColumnArgs } from "../decorators";
import { AnEntity } from "../entity";
import { ObjectKey } from "../object-key";
import { IndexMethod } from "../structure";
import { IndexWheres } from "../where-args";

export type IndexMetadataArgs = {
  klass: AnEntity;

  name: string;

  columns: IndexColumnArgs<ObjectKey>[];

  includeColumns?: string[];

  unique?: boolean;
  nullsDistinct?: boolean;
  method?: IndexMethod;
  where?: IndexWheres<InstanceType<AnEntity>>;
};
