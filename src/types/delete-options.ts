import { AnEntity } from "./entity";

export type DeleteOptions<
  T extends AnEntity,
  ReturnedFields extends keyof InstanceType<T>
> = {
  returning?: ReturnedFields[];
};
