import { ColumnMetadata } from "./column-metadata";
import { RelationMetadata } from "./relation-metadata";
import { AnEntity, Entity } from "../types/entity";
import { UniqueConstraintMetadata } from "./unique-constraint";

export class TableMetadata {
  tablename: string;

  klass: AnEntity;

  schemaname?: string;

  get fullName(): string {
    if (this.schemaname?.length) {
      return `${this.schemaname}.${this.tablename}`;
    }

    return this.tablename;
  }

  columns: ColumnMetadata[] = [];
  columnsMap: Map<string, ColumnMetadata> = new Map();

  primaryKey: UniqueConstraintMetadata<AnEntity>;

  relations: Map<string, RelationMetadata> = new Map();
}
