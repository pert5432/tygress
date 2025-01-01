import { ColumnMetadata } from "./column-metadata";
import { RelationMetadata } from "./relation-metadata";
import { Entity } from "./types/entity";

export class TableMetadata {
  tablename: string;

  klass: Entity<unknown>;

  schemaname?: string;

  get fullName(): string {
    if (this.schemaname?.length) {
      return `${this.schemaname}.${this.tablename}`;
    }

    return this.tablename;
  }

  columns: ColumnMetadata[] = [];
  columnsMap: Map<string, ColumnMetadata> = new Map();

  relations: Map<string, RelationMetadata> = new Map();
}
