import { ColumnMetadata } from "../../metadata";
import { q } from "../../utils";

export abstract class StructureSqlBuilderUtils {
  static dataType(column: ColumnMetadata): string {
    const options: string = (() => {
      switch (column.dataType) {
        case "TIMESTAMP":
        case "TIMESTAMPTZ":
        case "TIMESTAMP WITH TIMEZONE":
        case "TIME":
        case "TIMETZ":
        case "TIME WITH TIME ZONE":
          return column.precision ? ` (${column.precision})` : "";
        case "BIT":
        case "BIT VARYING":
        case "VARBIT":
        case "CHARACTER":
        case "CHAR":
        case "CHARACTER VARYING":
        case "VARCHAR":
          return column.maxLength ? ` (${column.maxLength})` : "";
        case "NUMERIC":
        case "DECIMAL": {
          if (!column.scale && !column.precision) {
            return "";
          }

          if (column.scale && !column.precision) {
            throw new Error(
              `If you specify scale you also need to specify precision`
            );
          }

          return ` (${[column.precision, column.scale]
            .filter((e) => !!e)
            .join(", ")})`;
        }

        default:
          return "";
      }
    })();

    return `${column.dataType}${options}`;
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
