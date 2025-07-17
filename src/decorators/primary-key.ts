import { METADATA_STORE } from "../metadata/metadata-store";
import { PrimaryKeyDecoratorArgs } from "../types/decorators";
import { AnEntity } from "../types/entity";

export const PrimaryKey = <K extends Object, F extends keyof K>(
  args: PrimaryKeyDecoratorArgs<K[F]>
) => {
  return function (target: K, propertyName: F) {
    METADATA_STORE.addColumn({
      ...args,
      fieldName: propertyName.toString(),
      klass: target.constructor as AnEntity,
      dataType: args.type,
      nullable: false,
    });

    METADATA_STORE.addUniqueConstraint({
      klass: target.constructor as AnEntity,
      fieldName: propertyName.toString(),
    });
  };
};
