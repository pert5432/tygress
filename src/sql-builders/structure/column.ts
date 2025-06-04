import { ColumnMetadata } from "../../metadata";
import { StructureSqlBuilderUtils } from "./utils";

export class ColumnStructureSqlBuilder {
  constructor(private column: ColumnMetadata) {}

  public sql(): string {
    const defaultValue = this.column.default
      ? [StructureSqlBuilderUtils.defaultValue(this.column)]
      : [];
    const nullable = this.column.nullable === false ? [`NOT NULL`] : [];
    const primaryKey = this.column.primaryKey ? [`PRIMARY KEY`] : [];

    let additives = [defaultValue, nullable, primaryKey].flat().join(" ");
    additives = additives.length ? ` ${additives}` : "";

    return `${this.column.name} ${StructureSqlBuilderUtils.dataType(
      this.column
    )}${additives}`;
  }
}
