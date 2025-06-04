import { ColumnMetadata, TableMetadata } from "../../metadata";
import { pad } from "../../utils";
import { ColumnStructureSqlBuilder } from "./column";
import { StructureSqlBuilderUtils } from "./utils";

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
    this.do(
      `ALTER COLUMN ${
        column.name
      } SET DATA TYPE ${StructureSqlBuilderUtils.dataType(column)}`
    );
  }

  setDefault(column: ColumnMetadata): void {
    if (!column.default) {
      throw new Error(`Column ${column.name} does not have a default value`);
    }

    this.do(
      `ALTER COLUMN ${
        column.name
      } SET DEFAULT ${StructureSqlBuilderUtils.defaultValue(column)}`
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
}
