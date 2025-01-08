import { AnEntity } from "../types";

export class UniqueConstraintMetadata<E extends AnEntity> {
  klass: E;

  fieldName: string;
}
