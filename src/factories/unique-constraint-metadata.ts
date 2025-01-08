import { UniqueConstraintMetadata } from "../metadata/unique-constraint";
import { AnEntity } from "../types";
import { UniqueConstraintMetadataArgs } from "../types/create-args";

export abstract class UniqueConstraintMetadataFactory {
  public static create({
    fieldName,
    klass,
  }: UniqueConstraintMetadataArgs): UniqueConstraintMetadata<AnEntity> {
    const e = new UniqueConstraintMetadata();

    e.fieldName = fieldName;
    e.klass = klass;

    return e;
  }
}
