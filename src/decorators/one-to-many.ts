import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata-store";
import { Entity } from "../types/entity";

export const OneToMany = <Foreign extends Entity<unknown>>(
  foreign: Foreign,
  foreignField: keyof InstanceType<Foreign>
) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addRelation({
      type: Relation.ONE_TO_MANY,
      foreign,
      foreignField: foreignField.toString(),
      primary: target.constructor as Entity<unknown>,
      primaryField: propertyName,
    });
  };
};
