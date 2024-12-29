import { METADATA_STORE } from "../metadata-store";
import { TableMetadata } from "../table-metadata";
import { Entity } from "../types/entity";

export const Table = (tablename: string): ClassDecorator => {
  return function (target: Object) {
    METADATA_STORE.addTable(
      target as Entity<unknown>,
      new TableMetadata(tablename, target as Entity<unknown>)
    );
  };
};
