import { ColumnMetadata } from "../../metadata";
import { q } from "../../utils";

export abstract class StructureSqlBuilderUtils {
  static dataType(column: ColumnMetadata): string {
    const { dataType: type } = column;

    switch (type) {
      case "TIMESTAMP":
      case "TIMESTAMPTZ":
      case "TIME":
      case "TIMETZ":
        return column.precision ? `${type} (${column.precision})` : type;

      case "TIMESTAMP WITH TIME ZONE":
        return column.precision
          ? `TIMESTAMP (${column.precision}) WITH TIME ZONE`
          : type;

      case "TIME WITH TIME ZONE":
        return column.precision
          ? `TIME (${column.precision}) WITH TIME ZONE`
          : type;

      case "BIT":
      case "BIT VARYING":
      case "VARBIT":
      case "CHARACTER":
      case "CHAR":
      case "CHARACTER VARYING":
      case "VARCHAR":
        return column.maxLength ? `${type} (${column.maxLength})` : type;

      case "NUMERIC":
      case "DECIMAL": {
        if (!column.scale && !column.precision) {
          return type;
        }

        if (column.scale && !column.precision) {
          throw new Error(
            `If you specify scale you also need to specify precision`
          );
        }

        return `${type} (${[column.precision, column.scale]
          .filter((e) => !!e)
          .join(", ")})`;
      }

      default:
        return type;
    }
  }

  static defaultValue(column: ColumnMetadata): string {
    if (!column.default) {
      throw new Error(`Column ${column.name} does not have a default value`);
    }

    switch (column.default.type) {
      case "expression":
        return `${column.default.value}`;
      case "value":
        return `${q(column.default.value)}::${column.dataType}`;
    }
  }
}
