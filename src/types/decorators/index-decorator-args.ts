import { AnEntity } from "../entity";
import { OneOf } from "../one-of";
import { Pretty } from "../pretty";
import { IndexMethod } from "../structure";

export type IndexDecoratorArgs<
  K extends AnEntity,
  F extends keyof InstanceType<K>
> = {
  /**
   * A column can either be an entity field (`"firstName"`)
   *   or an object that can specify an entity field (`{field: "firstName"}`)
   *   or an object specifying an `SQL` expression (`{expression: "LOWER(field_name)"}`)
   */
  columns: F[] | IndexColumnArgs<F>[];

  /**
   * Columns to be included in the index using the `INCLUDE` keyword
   */
  includeColumns?: F[];

  unique?: boolean;
  nullsDistinct?: boolean;
  method?: IndexMethod;
};

export type IndexColumnArgs<F> = Pretty<
  OneOf<
    [
      {
        field: F;
      },
      { expression: string }
    ]
  > & { order?: "ASC" | "DESC"; nulls?: "FIRST" | "LAST" }
>;
