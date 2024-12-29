import { TableMetadata } from "./table-metadata";

export class ColumnMetadata {
  constructor(public name: string, public fieldName: string) {}

  table?: TableMetadata;

  get fullName(): string {
    if (this.table) {
      return `${this.table.fullName}.${this.name}`;
    }

    return this.name;
  }
}
