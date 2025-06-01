import { ColumnMetadata, TableMetadata } from "../../metadata";
import { pad, q } from "../../utils";
import { ColumnStructureSqlBuilder } from "./column";

export class AlterTableSqlBuilder {
  private actions: string[] = [];

  constructor(private table: TableMetadata) {}

  hasChanges(): boolean {
    return !!this.actions.length;
  }

  sql(): string {
    return `ALTER TABLE ${this.table.tablename}\n${pad(
      1,
      this.actions.join(",\n")
    )};`;
  }

  addColumn(column: ColumnMetadata): void {
    this.do(`ADD COLUMN ${new ColumnStructureSqlBuilder(column).sql()}`);
  }

  dropColumn(columnName: string): void {
    this.do(`DROP COLUMN ${columnName}`);
  }

  setDataType(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} SET DATA TYPE ${column.dataType}`);
  }

  setDefault(column: ColumnMetadata): void {
    this.do(
      `ALTER COLUMN ${column.name} SET DEFAULT ${this.formatDefaultValue(
        column
      )}`
    );
  }

  dropDefault(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} DROP DEFAULT`);
  }

  setNotNull(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} SET NOT NULL`);
  }

  dropNotNull(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} DROP NOT NULL`);
  }

  //
  // PRIVATE
  //

  private do(statement: string): void {
    this.actions.push(statement);
  }

  private formatDefaultValue(column: ColumnMetadata): string {
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
