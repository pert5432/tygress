import { ColumnMetadata, TableMetadata } from "../../metadata";
import { pad } from "../../utils";
import { ColumnStructureSqlBuilder } from "./column";

export class CreateTableSqlBuilder {
  constructor(private table: TableMetadata) {}

  sql(): string {
    return [
      `CREATE TABLE ${this.table.tablename} (`,
      this.table.columns.map((c) => this.column(c)).join(",\n"),
      ");",
    ].join("\n");
  }

  private column(column: ColumnMetadata): string {
    return pad(1, new ColumnStructureSqlBuilder(column).sql());
  }
}
