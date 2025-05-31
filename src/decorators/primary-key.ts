import { METADATA_STORE } from "../metadata/metadata-store";
import { PrimaryKeyDecoratorArgs } from "../types/decorators";
import { AnEntity } from "../types/entity";

export const PrimaryKey = (args: PrimaryKeyDecoratorArgs) => {
  return function (target: Object, propertyName: string) {
    const { name, type, default: defaultValue } = args;

    METADATA_STORE.addColumn({
      name,
      fieldName: propertyName,
      klass: target.constructor as AnEntity,

      dataType: type,
      default: defaultValue,
      nullable: false,
    });

    METADATA_STORE.addUniqueConstraint({
      klass: target.constructor as AnEntity,
      fieldName: propertyName,
    });
  };
};
