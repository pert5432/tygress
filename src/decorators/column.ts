import { METADATA_STORE } from "../metadata-store";
import { Entity } from "../types/entity.type";

export const Column = (name: string) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addColumn(target.constructor as Entity<unknown>, {
      name,
      fieldName: propertyName,
    });
  };
};
