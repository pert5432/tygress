import { ColumnMetadata } from "../metadata";
import {
  ColumnMetadataColumnIdentifierSqlBuilder,
  ColumnNameColumnIdentifierSqlBuilder,
} from "../sql-builders";

export abstract class ColumnIdentifierSqlBuilderFactory {
  static createColumnMeta(
    alias: string,
    column: ColumnMetadata,
    cast?: string
  ): ColumnMetadataColumnIdentifierSqlBuilder {
    const e = new ColumnMetadataColumnIdentifierSqlBuilder();

    e.alias = alias;
    e.column = column;
    e.cast = cast;

    return e;
  }

  static createColumnName(
    alias: string,
    columName: string,
    cast?: string
  ): ColumnNameColumnIdentifierSqlBuilder {
    const e = new ColumnNameColumnIdentifierSqlBuilder();

    e.alias = alias;
    e.columnName = columName;
    e.cast = cast;

    return e;
  }
}
