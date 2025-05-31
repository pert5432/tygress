import { METADATA_STORE } from "../metadata/metadata-store";
import { ColumnDecoratorArgs } from "../types/decorators";
import { Entity } from "../types/entity";

export const Column = (args: ColumnDecoratorArgs) => {
  return function (target: Object, propertyName: string) {
    const { name, type, nullable, default: defaultValue } = args;

    METADATA_STORE.addColumn({
      name,
      fieldName: propertyName,
      klass: target.constructor as Entity<unknown>,

      dataType: type,
      nullable: nullable ?? false,
      default: defaultValue,
    });
  };
};
