import { AnEntity } from "./entity";

export type InsertPayload<T extends AnEntity> =
  | InstanceType<T>
  | Partial<{ [K in keyof InstanceType<T>]: InstanceType<T>[K] }>;
