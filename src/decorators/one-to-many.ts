import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata/metadata-store";
import { AnEntity } from "../types/entity";

export const OneToMany = <Foreign extends AnEntity>(
  foreignFn: () => Foreign,
  foreignField: keyof InstanceType<Foreign>
) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addRelationArgs({
      type: Relation.ONE_TO_MANY,
      foreign: foreignFn,
      foreignField: foreignField.toString(),
      primary: () => target.constructor as AnEntity,
      primaryField: propertyName,
    });
  };
};
