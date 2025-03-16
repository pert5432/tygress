import { AnEntity } from "./entity";

export type InsertOptions<
  T extends AnEntity,
  K extends keyof InstanceType<T>
> = {
  returning?: K[];
} & OnConflict<T, K>;

type OnConflict<T extends AnEntity, K extends keyof InstanceType<T>> =
  | {}
  | {
      onConflict: "DO NOTHING";
    }
  | {
      onConflict: "DO UPDATE";
      conflictColumns: K[];
    };
