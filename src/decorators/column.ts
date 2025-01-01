import { METADATA_STORE } from "../metadata-store";
import { Entity } from "../types/entity";

export const Column = (name: string) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addColumn({
      name,
      fieldName: propertyName,
      klass: target.constructor as Entity<unknown>,
    });
  };
};
