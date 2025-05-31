import { ColumnMetadata } from "../metadata/column-metadata";
import { ColumnMetadataArgs } from "../types/create-args";
import { isNull } from "../utils";

export abstract class ColumnMetadataFactory {
  public static create<T>({
    name,
    fieldName,
    select,

    dataType,
    nullable,
    default: defaultValue,
    primaryKey,
  }: ColumnMetadataArgs<T>): ColumnMetadata {
    const e = new ColumnMetadata();

    e.name = name;
    e.fieldName = fieldName;

    e.select = isNull(select) ? true : select!;

    e.dataType = dataType;
    e.nullable = nullable ?? false;
    e.default = defaultValue
      ? this.isFunction(defaultValue)
        ? { type: "expression", value: defaultValue() }
        : { type: "value", value: defaultValue.toString() }
      : undefined;
    e.primaryKey = primaryKey ?? false;

    return e;
  }

  private static isFunction(value: unknown): value is () => string {
    return typeof value === "function";
  }
}
