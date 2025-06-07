import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata/metadata-store";
import { RelationForeignSideArgs } from "../types";
import { AnEntity, Entity } from "../types/entity";

export const ManyToOne = <Foreign extends Object, Primary extends AnEntity>(
  primary: Primary,
  primaryField: keyof InstanceType<Primary>,
  foreignKey: keyof Foreign,
  args?: RelationForeignSideArgs<Primary>
) => {
  return function (target: Foreign, propertyName: string) {
    METADATA_STORE.addRelation({
      type: Relation.MANY_TO_ONE,

      foreign: target.constructor as Entity<unknown>,
      foreignField: propertyName,
      foreignKey: foreignKey?.toString(),

      primary,
      primaryField: primaryField.toString(),
      primaryKey: args?.primaryKey?.toString() ?? "id",

      onUpdate: args?.onUpdate,
      onDelete: args?.onDelete,
    });
  };
};
