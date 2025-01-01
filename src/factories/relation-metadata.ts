import { RelationMetadata } from "../metadata";
import { RelationMetadataArgs } from "../types/args";
import { fieldNameToColumName } from "../utils";

export abstract class RelationMetadataFactory {
  public static create({
    type,
    foreign,
    foreignField,
    foreignKey,
    primary,
    primaryField,
    primaryKey,
  }: RelationMetadataArgs): RelationMetadata {
    const e = new RelationMetadata();

    e.type = type;

    e.primary = primary;
    e.primaryField = primaryField;
    e.primaryKey = primaryKey ?? "id";

    e.foreign = foreign;
    e.foreignField = foreignField;
    e.foreignKey = foreignKey ?? fieldNameToColumName(foreignField) + "_id";

    return e;
  }
}
