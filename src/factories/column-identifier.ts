import { ColumnMetadata } from "../metadata";
import {
  ColumnMetadataColumnIdentifierSqlBuilder,
  ColumnNameColumnIdentifierSqlBuilder,
} from "../sql-builders";

export abstract class ColumnIdentifierSqlBuilderFactory {
  static createColumnMeta(
    alias: string,
    column: ColumnMetadata
  ): ColumnMetadataColumnIdentifierSqlBuilder {
    const e = new ColumnMetadataColumnIdentifierSqlBuilder();

    e.alias = alias;
    e.column = column;

    return e;
  }

  static createColumnName(
    alias: string,
    columName: string
  ): ColumnNameColumnIdentifierSqlBuilder {
    const e = new ColumnNameColumnIdentifierSqlBuilder();

    e.alias = alias;
    e.columnName = columName;

    return e;
  }
}
