import { AnEntity } from "./entity";

export type UpdateResult<T extends AnEntity> = {
  affectedRows: number;

  rows: InstanceType<T>[];
};
