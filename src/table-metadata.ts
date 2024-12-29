import { ColumnMetadata } from "./column-metadata";
import { RelationMetadata } from "./relation-metadata";
import { Entity } from "./types/entity";

export class TableMetadata {
  constructor(public tablename: string, public klass: Entity<unknown>) {}

  get fullName(): string {
    if (this.schemaname?.length) {
      return `${this.schemaname}.${this.tablename}`;
    }

    return this.tablename;
  }

  schemaname?: string;

  columns: ColumnMetadata[] = [];
  columnsMap: Map<string, ColumnMetadata> = new Map();

  relations: Map<string, RelationMetadata> = new Map();
}
