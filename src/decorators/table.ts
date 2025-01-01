import { METADATA_STORE } from "../metadata-store";
import { Entity } from "../types/entity";

export const Table = (tablename: string): ClassDecorator => {
  return function (target: Object) {
    METADATA_STORE.addTable({ tablename, klass: target as Entity<unknown> });
  };
};
