import { ColumnMetadata } from "./column-metadata";
import { Relation } from "./enums/relation";
import { RelationMetadata } from "./relation-metadata";
import { TableMetadata } from "./table-metadata";
import { Entity } from "./types/entity";

class MetadataStore {
  public tables = new Map<Entity<unknown>, TableMetadata>();
  public columns = new Map<Entity<unknown>, ColumnMetadata[]>();

  public relations: RelationMetadata[] = [];

  public addTable(table: Entity<unknown>, metadata: TableMetadata): void {
    if (this.tables.get(table)) {
      throw new Error(`Metadata for table ${table} already registered`);
    }

    // Add existing columns to this tables metadata
    const columns = this.columns.get(table) ?? [];
    metadata.columns = columns;

    for (const column of columns) {
      // Add column to map on table
      metadata.columnsMap.set(column.fieldName, column);

      // Add table metadata to column
      column.table = metadata;
    }

    // Add relations to map on table metadata
    this.relations
      .filter((e) => e.primary === table)
      .forEach((e) => metadata.relations.set(e.primaryField, e));
    this.relations
      .filter((e) => e.foreign === table)
      .forEach((e) => metadata.relations.set(e.foreignField, e));

    this.tables.set(table, metadata);
  }

  public addColumn(table: Entity<unknown>, column: ColumnMetadata): void {
    const newColumns = this.columns.get(table) ?? [];
    newColumns.push(column);

    this.columns.set(table, newColumns);
  }

  public getTable<T>(table: T): TableMetadata {
    const res = this.tables.get(table as Entity<unknown>);
    if (!res) {
      throw new Error(`No metadata found for ${table}`);
    }

    return res;
  }

  public addRelation(relation: RelationMetadata) {
    // Inserting OneToMany so current relation is the primary side
    // Back-fill the primary class to the inverse side of the currently inserted relation
    if (relation.type === Relation.ONE_TO_MANY && relation.foreign) {
      const inverseRelation = this.relations.find(
        (e) =>
          e.type === Relation.MANY_TO_ONE &&
          e.foreign === relation.foreign &&
          e.primaryField === relation.primaryField &&
          e.foreignField === relation.foreignField
      );

      if (inverseRelation) {
        if (!inverseRelation.primary) {
          inverseRelation.primary = relation.primary;
        }

        relation.primaryKey = inverseRelation.primaryKey;
        relation.foreignKey = inverseRelation.foreignKey;
      }
    }

    // Inserting ManyToOne so current relation is the foreign side
    // Back-fill the foreign class to the inverse side of the currently inserted relation
    if (relation.type === Relation.MANY_TO_ONE && relation.primary) {
      const inverseRelation = this.relations.find(
        (e) =>
          e.type === Relation.ONE_TO_MANY &&
          e.primary === relation.primary &&
          e.primaryField === relation.primaryField &&
          e.foreignField === relation.foreignField
      );

      if (inverseRelation) {
        if (!inverseRelation.foreign) {
          inverseRelation.foreign = relation.foreign;
        }

        inverseRelation.foreignKey = relation.foreignKey;
        inverseRelation.primaryKey = relation.primaryKey;
      }
    }

    // Finally insert new relation into the array
    this.relations.push(relation);
  }
}

export const METADATA_STORE = new MetadataStore();
