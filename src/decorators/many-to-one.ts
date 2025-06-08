import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata/metadata-store";
import { AnEntity } from "../types/entity";

export const ManyToOne = <Foreign extends Object, Primary extends AnEntity>(
  primaryFn: () => Primary,
  primaryField: keyof InstanceType<Primary>,
  foreignKey: keyof Foreign,
  primaryKey?: keyof InstanceType<Primary>
) => {
  return function (target: Foreign, propertyName: string) {
    METADATA_STORE.addRelation({
      type: Relation.MANY_TO_ONE,

      foreign: () => target.constructor as AnEntity,
      foreignField: propertyName,
      foreignKey: foreignKey?.toString(),

      primary: primaryFn,
      primaryField: primaryField.toString(),
      primaryKey: primaryKey?.toString() ?? "id",
    });
  };
};
