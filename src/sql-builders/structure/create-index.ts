import {
  ColumnIdentifierSqlBuilderFactory,
  ComparisonFactory,
} from "../../factories";
import {
  IndexColumnMetadata,
  IndexMetadata,
  METADATA_STORE,
} from "../../metadata";
import { ComparisonWrapper } from "../comparison";
import { ParamBuilder } from "../param-builder";

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

    const where = this.where();

    return `CREATE${unique} INDEX ${this.meta.name} ON ${this.meta.table.tablename} USING ${this.meta.method} (${keyColumns})${include}${nullsDistinct}${where}`;
  }

  private keyColumn(c: IndexColumnMetadata): string {
    const options = [c.order, c.nulls ? `NULLS ${c.nulls}` : undefined]
      .filter((e) => e?.length)
      .map((e) => ` ${e}`)
      .join("");

    return `${c.column ? c.column.name : c.expression}${options}`;
  }

  private where(): string {
    if (!this.meta.where) {
      return "";
    }

    const predicate = new ComparisonWrapper(
      Object.entries(this.meta.where).map(([fieldName, condition]) =>
        ComparisonFactory.createFromConditionIdentifier(
          ColumnIdentifierSqlBuilderFactory.createNaked(
            METADATA_STORE.getColumn(this.meta.table.klass, fieldName)
          ),
          condition
        )
      ),
      "AND"
    ).sql(new ParamBuilder());

    return ` WHERE ${predicate}`;
  }
}
