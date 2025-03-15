import { AnEntity } from "./entity";

export type InsertResult<T extends AnEntity> = {
  affectedRows: number;

  rows: T[];
};
