import { Relation } from "../enums";
import { METADATA_STORE } from "../metadata/metadata-store";
import { RelationForeignSideArgs } from "../types";
import { AnEntity } from "../types/entity";

export const ManyToOne = <Foreign extends Object, Primary extends AnEntity>(
  primaryFn: () => Primary,
  primaryField: keyof InstanceType<Primary>,
  foreignKey: keyof Foreign,
  args?: RelationForeignSideArgs<Primary>
) => {
  return function (target: Foreign, propertyName: string) {
    METADATA_STORE.addRelationArgs({
      type: Relation.MANY_TO_ONE,

      foreign: () => target.constructor as AnEntity,
      foreignField: propertyName,
      foreignKey: foreignKey?.toString(),

      primary: primaryFn,
      primaryField: primaryField.toString(),
      primaryKey: args?.primaryKey?.toString() ?? "id",

      onUpdate: args?.onUpdate,
      onDelete: args?.onDelete,
    });
  };
};
