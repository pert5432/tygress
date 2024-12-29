import { doubleQuote } from "./double-quote";
import { TableMetadata } from "./table-metadata";

export class ColumnMetadata {
  constructor(public name: string, public fieldName: string) {}

  // Is set when table metadata is created
  table?: TableMetadata;

  get fullName(): string {
    if (this.table) {
      return `${doubleQuote(this.table.fullName)}.${doubleQuote(this.name)}`;
    }

    return doubleQuote(this.name);
  }
}
