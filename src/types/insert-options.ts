import { AnEntity } from "./entity";

export type InsertOptions<
  T extends AnEntity,
  ReturnedFields extends keyof InstanceType<T>,
  ConflictFields extends keyof InstanceType<T>,
  UpdateFields extends keyof InstanceType<T>
> = {
  returning?: ReturnedFields[] | "*";
} & OnConflict<T, ConflictFields, UpdateFields>;

type OnConflict<
  T extends AnEntity,
  ConflictFields extends keyof InstanceType<T>,
  UpdateFields extends keyof InstanceType<T>
> =
  | {
      onConflict?: undefined;
      conflictFields?: undefined;
      updateFields?: undefined;
    }
  | {
      onConflict: "DO NOTHING";
      conflictFields?: ConflictFields[];
      updateFields?: undefined;
    }
  | {
      onConflict: "DO UPDATE";
      conflictFields: ConflictFields[];
      updateFields: UpdateFields[];
    };
