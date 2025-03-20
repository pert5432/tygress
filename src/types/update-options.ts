import { AnEntity } from "./entity";

export type UpdateOptions<
  T extends AnEntity,
  ReturnedFields extends keyof InstanceType<T>
> = {
  returning?: ReturnedFields[];
};
