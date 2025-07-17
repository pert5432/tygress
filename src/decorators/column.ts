import { METADATA_STORE } from "../metadata/metadata-store";
import { ColumnDecoratorArgs } from "../types/decorators";
import { AnEntity } from "../types/entity";

export const Column = <K extends Object, F extends keyof K>(
  args: ColumnDecoratorArgs<K[F]>
) => {
  return function (target: K, propertyName: F) {
    METADATA_STORE.addColumn({
      ...args,
      fieldName: propertyName.toString(),
      klass: target.constructor as AnEntity,
      dataType: args.type,
      nullable: args.nullable ?? false,
    });
  };
};
