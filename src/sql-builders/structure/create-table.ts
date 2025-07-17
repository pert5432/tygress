import { ColumnMetadata, TableMetadata } from "../../metadata";
import { pad } from "../../utils";
import { ColumnStructureSqlBuilder } from "./column";

export class CreateTableSqlBuilder {
  constructor(private table: TableMetadata) {}

  sql(): string {
    return [
      `CREATE TABLE ${this.table.tablename} (`,
      pad(
        1,
        [
          ...this.table.columns.map((c) => this.column(c)),
          this.primaryKey(),
        ].join(",\n")
      ),
      ");",
    ].join("\n");
  }

  private column(column: ColumnMetadata): string {
    return new ColumnStructureSqlBuilder(column).sql();
  }

  private primaryKey(): string {
    const primaryKey = this.table.columnsMap.get(
      this.table.primaryKey.fieldName
    )!;

    return `CONSTRAINT "${this.table.tablename}_pk" PRIMARY KEY ("${primaryKey.name}")`;
  }
}
