import { ColumnMetadata } from "../../metadata";
import { q } from "../../utils";

export class ColumnStructureSqlBuilder {
  constructor(private column: ColumnMetadata) {}

  public sql(): string {
    const defaultValue = this.formatDefault();
    const nullable = this.column.nullable === false ? [`NOT NULL`] : [];
    const primaryKey = this.column.primaryKey ? [`PRIMARY KEY`] : [];

    let additives = [defaultValue, nullable, primaryKey].flat().join(" ");
    additives = additives.length ? ` ${additives}` : "";

    return `${this.column.name} ${this.column.dataType}${additives}`;
  }

  private formatDefault(): string[] {
    if (!this.column.default) {
      return [];
    }

    switch (this.column.default.type) {
      case "expression":
        return [`DEFAULT ${this.column.default.value}`];
      case "value":
        return [
          `DEFAULT ${q(this.column.default.value)}::${this.column.dataType}`,
        ];
    }
  }
}
