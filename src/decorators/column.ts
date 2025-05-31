import { METADATA_STORE } from "../metadata/metadata-store";
import { ColumnDecoratorArgs } from "../types/decorators";
import { Entity } from "../types/entity";

export const Column = <K extends Object, F extends keyof K>(
  args: ColumnDecoratorArgs<K[F]>
) => {
  return function (target: K, propertyName: F) {
    const { name, type, nullable, default: defaultValue } = args;

    METADATA_STORE.addColumn({
      name,
      fieldName: propertyName.toString(),
      klass: target.constructor as Entity<unknown>,

      dataType: type,
      nullable: nullable ?? false,
      default: defaultValue,
    });
  };
};
