import { METADATA_STORE } from "../metadata/metadata-store";
import { AnEntity } from "../types/entity";

export const PrimaryKey = (name: string) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addColumn({
      name,
      fieldName: propertyName,
      klass: target.constructor as AnEntity,
    });

    METADATA_STORE.addUniqueConstraint({
      klass: target.constructor as AnEntity,
      fieldName: propertyName,
    });
  };
};
