import { Relation } from "../enums/relation";
import { METADATA_STORE } from "../metadata-store";
import { RelationMetadata } from "../relation-metadata";
import { Entity } from "../types/entity";

export const OneToMany = <Foreign extends Entity<unknown>>(
  foreign: Foreign,
  foreignField: keyof InstanceType<Foreign>
) => {
  return function (target: Object, propertyName: string) {
    const e = new RelationMetadata();

    e.type = Relation.ONE_TO_MANY;

    e.foreign = foreign;
    e.foreignField = foreignField.toString();

    e.primary = target.constructor as Entity<unknown>;
    e.primaryField = propertyName;

    METADATA_STORE.addRelation(e);
  };
};
