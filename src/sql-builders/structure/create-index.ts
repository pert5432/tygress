import { IndexColumnMetadata, IndexMetadata } from "../../metadata";

export class CreateIndexSqlBuilder {
  constructor(private meta: IndexMetadata) {}

  sql(): string {
    const unique = this.meta.unique ? " UNIQUE" : "";

    const keyColumns = this.meta.keyColumns
      .map((c) => this.keyColumn(c))
      .join(", ");

    const include = this.meta.includeColumns.length
      ? ` INCLUDE (${this.meta.includeColumns.map((c) => c.name).join(", ")})`
      : "";

    const nullsDistinct = this.meta.nullsDistinct ? ` NULLS DISTINCT` : "";

    return `CREATE${unique} INDEX ${this.meta.name} ON ${this.meta.table.tablename} USING ${this.meta.method} (${keyColumns})${include}${nullsDistinct}`;
  }

  private keyColumn(c: IndexColumnMetadata): string {
    const options = [c.order, c.nulls ? `NULLS ${c.nulls}` : undefined]
      .filter((e) => e?.length)
      .map((e) => ` ${e}`)
      .join("");

    return `${c.column.name}${options}`;
  }
}
