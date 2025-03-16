import { AnEntity } from "./entity";

export type InsertOptions<
  T extends AnEntity,
  ReturnedFields extends keyof InstanceType<T>,
  ConflictFields extends keyof InstanceType<T>
> = {
  returning?: ReturnedFields[];
} & OnConflict<T, ConflictFields>;

type OnConflict<
  T extends AnEntity,
  ConflictFields extends keyof InstanceType<T>
> =
  | {
      onConflict?: undefined;
      conflictFields?: undefined;
    }
  | {
      onConflict: "DO NOTHING";
      conflictFields?: ConflictFields[];
    }
  | {
      onConflict: "DO UPDATE";
      conflictFields: ConflictFields[];
    };
