import { AnEntity } from "../entity";
import { IndexMethod } from "../structure";

export type IndexDecoratorArgs<
  K extends AnEntity,
  F extends keyof InstanceType<K>
> = {
  columns: F[] | IndexColumnArgs<F>[];
  includeColumns?: F[];
  unique?: boolean;
  nullsDistinct?: boolean;
  method?: IndexMethod;
};

export type IndexColumnArgs<F> = {
  field: F;
  order?: "ASC" | "DESC";
  nulls?: "FIRST" | "LAST";
};
