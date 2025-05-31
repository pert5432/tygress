import { ColumnMetadata } from "../../metadata";

export class ColumnStructureSqlBuilder {
  constructor(private column: ColumnMetadata) {}

  public sql(): string {
    const defaultValue = this.column.default
      ? [`DEFAULT ${this.column.default}`]
      : [];
    const nullable = this.column.nullable === false ? [`NOT NULL`] : [];
    const primaryKey = this.column.primaryKey ? [`PRIMARY KEY`] : [];

    let additives = [defaultValue, nullable, primaryKey].flat().join(" ");
    additives = additives.length ? ` ${additives}` : "";

    return `${this.column.name} ${this.column.dataType}${additives}`;
  }
}
