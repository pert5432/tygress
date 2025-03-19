import { AnEntity } from "./entity";

export type DeleteResult<T extends AnEntity> = {
  affectedRows: number;

  rows: InstanceType<T>[];
};
