import { METADATA_STORE } from "../metadata/metadata-store";
import { AnEntity } from "../types/entity";

export const Table = (tablename: string): ClassDecorator => {
  return function (target: Object) {
    METADATA_STORE.addTableArgs({ tablename, klass: target as AnEntity });
  };
};
