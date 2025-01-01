import { doubleQuote } from "./double-quote";
import { TableMetadata } from "./table-metadata";

export class ColumnMetadata {
  name: string;
  fieldName: string;

  // Is set when table metadata is created
  table?: TableMetadata;

  get fullName(): string {
    if (this.table) {
      return `${doubleQuote(this.table.fullName)}.${doubleQuote(this.name)}`;
    }

    return doubleQuote(this.name);
  }
}
