import { Relation } from "../enums/relation";
import { METADATA_STORE } from "../metadata-store";
import { RelationMetadata } from "../relation-metadata";
import { Entity } from "../types/entity";

export const ManyToOne = <Primary extends Entity<unknown>>(
  primary: Primary,
  primaryField: keyof InstanceType<Primary>,
  primaryKey: string,
  foreignKey: string
) => {
  return function (target: Object, propertyName: string) {
    const e = new RelationMetadata();
    e.type = Relation.MANY_TO_ONE;

    e.foreign = target.constructor as Entity<unknown>;
    e.foreignField = propertyName;
    e.foreignKey = foreignKey;

    e.primary = primary;
    e.primaryField = primaryField.toString();
    e.primaryKey = primaryKey;

    METADATA_STORE.addRelation(e);
  };
};
