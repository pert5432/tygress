import { ColumnMetadata } from "../metadata/column-metadata";
import { ColumnMetadataArgs } from "../types/create-args";
import { PostgresColumnDefinition } from "../types/postgres";
import { DataType } from "../types/structure";
import { isNull, parsePgColumnDefault } from "../utils";

export abstract class ColumnMetadataFactory {
  public static create<T>(args: ColumnMetadataArgs<T>): ColumnMetadata {
    const {
      name,
      fieldName,
      select,

      dataType,
      nullable,
      default: defaultValue,
      primaryKey,
    } = args;

    const e = new ColumnMetadata();

    e.name = name;
    e.fieldName = fieldName;

    e.select = isNull(select) ? true : select;

    e.dataType = dataType;
    e.nullable = nullable ?? false;
    e.default = defaultValue
      ? this.isFunction(defaultValue)
        ? { type: "expression", value: defaultValue() }
        : { type: "value", value: defaultValue.toString() }
      : undefined;

    e.precision = (args as { precision?: number }).precision;
    e.scale = (args as { scale?: number }).scale;
    e.maxLength = (args as { maxLength?: number }).maxLength;

    e.primaryKey = primaryKey ?? false;

    return e;
  }

  public static fromPGColumn(
    pgColumn: PostgresColumnDefinition
  ): ColumnMetadata {
    const e = new ColumnMetadata();

    e.name = pgColumn.column_name;

    e.dataType = pgColumn.data_type.toUpperCase() as DataType;
    e.nullable = pgColumn.is_nullable === "YES";
    e.default = pgColumn.column_default?.length
      ? parsePgColumnDefault(pgColumn.column_default)
      : undefined;

    e.precision =
      pgColumn.numeric_precision ??
      pgColumn.datetime_precision ??
      pgColumn.interval_precision ??
      undefined;
    e.scale = pgColumn.numeric_scale ?? undefined;
    e.maxLength = pgColumn.character_maximum_length ?? undefined;

    return e;
  }

  private static isFunction(value: unknown): value is () => string {
    return typeof value === "function";
  }
}
