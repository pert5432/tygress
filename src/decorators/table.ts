import { METADATA_STORE } from "../metadata-store";
import { Entity } from "../types/entity.type";

export const Table = (tablename: string): ClassDecorator => {
  return function (target: Object) {
    METADATA_STORE.addTable(target as Entity<unknown>, {
      tablename,
      className: (target as { name: string }).name,
      class: target as Entity<unknown>,
      columns: [],
    });
  };
};
