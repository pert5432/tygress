import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata/metadata-store";
import { Entity } from "../types/entity";

export const ManyToOne = <Primary extends Entity<unknown>>(
  primary: Primary,
  primaryField: keyof InstanceType<Primary>,
  primaryKey?: string,
  foreignKey?: string
) => {
  return function (target: Object, propertyName: string) {
    METADATA_STORE.addRelation({
      type: Relation.MANY_TO_ONE,
      foreign: target.constructor as Entity<unknown>,
      foreignField: propertyName,
      foreignKey,

      primary,
      primaryField: primaryField.toString(),
      primaryKey,
    });
  };
};
