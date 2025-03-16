import { ColumnMetadata } from "./column-metadata";
import { RelationMetadata } from "./relation-metadata";
import { AnEntity } from "../types/entity";
import { UniqueConstraintMetadata } from "./unique-constraint";
import { TableIdentifierSqlBuilderFactory } from "../factories";

export class TableMetadata {
  tablename: string;

  klass: AnEntity;

  schemaname?: string;

  get dmlIdentifier() {
    return TableIdentifierSqlBuilderFactory.createDML(this.tablename);
  }

  columns: ColumnMetadata[] = [];

  getColumn(fieldName: string) {
    const c = this.columnsMap.get(fieldName);

    if (!c) {
      throw new Error(`No column found with field name ${fieldName}`);
    }

    return c;
  }

  get columnsSelectableByDefault() {
    return this.columns.filter((e) => e.select);
  }

  columnsMap: Map<string, ColumnMetadata> = new Map();

  primaryKey: UniqueConstraintMetadata<AnEntity>;

  relations: Map<string, RelationMetadata> = new Map();

  arrayFields: Set<string> = new Set();
}
