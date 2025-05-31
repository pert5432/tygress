import { ColumnMetadata, TableMetadata } from "../../metadata";
import { pad } from "../../utils";
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
    this.actions.push(
      `ADD COLUMN ${new ColumnStructureSqlBuilder(column).sql()}`
    );
  }

  dropColumn(columnName: string): void {
    this.actions.push(`DROP COLUMN ${columnName}`);
  }
}
