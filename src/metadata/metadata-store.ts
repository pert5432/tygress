import { Relation } from "../enums";
import {
  ColumnMetadataFactory,
  RelationMetadataFactory,
  TableMetadataFactory,
  UniqueConstraintMetadataFactory,
} from "../factories";
import { RelationMetadata, TableMetadata, ColumnMetadata } from ".";
import {
  ColumnMetadataArgs,
  RelationMetadataArgs,
  TableMetadataArgs,
  UniqueConstraintMetadataArgs,
} from "../types/create-args";
import { AnEntity, Entity } from "../types";
import { UniqueConstraintMetadata } from "./unique-constraint";

class MetadataStore {
  public tables = new Map<Entity<unknown>, TableMetadata>();
  public columns = new Map<Entity<unknown>, ColumnMetadata[]>();

  public relations: RelationMetadata[] = [];

  public uniqueConstraints = new Map<
    AnEntity,
    UniqueConstraintMetadata<AnEntity>
  >();

  // All fields which are decorated by our decorators
  public fields = new Map<AnEntity, string[]>();

  //
  // Getters
  //
  public getTable<T extends Entity<unknown>>(table: T): TableMetadata {
    const res = this.tables.get(table as Entity<unknown>);
    if (!res) {
      throw new Error(`No metadata found for ${table}`);
    }

    return res;
  }

  public getTable_(entity: AnEntity): TableMetadata | undefined {
    return this.tables.get(entity);
  }

  public getTablePrimaryKey<T extends AnEntity>(table: T): ColumnMetadata {
    const tableMeta = this.getTable(table);

    return tableMeta.columnsMap.get(tableMeta.primaryKey.fieldName)!;
  }

  public getColumn<T extends AnEntity>(
    table: T,
    fieldName: keyof T
  ): ColumnMetadata {
    const column = METADATA_STORE.getTable(table).columnsMap.get(
      fieldName.toString()
    );

    if (!column) {
      throw new Error(
        `No column found for entity ${
          table.name
        }, field ${fieldName.toString()}`
      );
    }

    return column;
  }

  public getRelation(entity: AnEntity, fieldName: string): RelationMetadata {
    const relation = this.getTable(entity).relations.get(fieldName);

    if (!relation) {
      throw new Error(
        `No relation found for entity ${entity.name}, fieldName ${fieldName}`
      );
    }

    return relation;
  }

  //
  // Modifiers
  //
  public addTable(args: TableMetadataArgs): void {
    if (this.tables.get(args.klass)) {
      throw new Error(`Metadata for table ${args.klass} already registered`);
    }

    const uniqueConstraint = this.uniqueConstraints.get(args.klass);
    if (!uniqueConstraint) {
      throw new Error(`No unique constraint found for table ${args.klass}`);
    }

    const columns = this.columns.get(args.klass);
    if (!columns) {
      throw new Error(`No columns found for table ${args.klass}`);
    }

    const metadata = TableMetadataFactory.create(
      args,
      columns,
      this.relations.filter(
        (e) => e.primary === args.klass || e.foreign === args.klass
      ),
      uniqueConstraint,
      this.fields.get(args.klass) ?? []
    );

    this.tables.set(metadata.klass, metadata);
  }

  public addColumn(args: ColumnMetadataArgs): void {
    const metadata = ColumnMetadataFactory.create(args);

    const newColumns = this.columns.get(args.klass) ?? [];
    newColumns.push(metadata);

    this.columns.set(args.klass, newColumns);

    this.addField(args.klass, args.fieldName);
  }

  public addUniqueConstraint(args: UniqueConstraintMetadataArgs) {
    const existingConstraint = this.uniqueConstraints.get(args.klass);

    if (existingConstraint) {
      throw new Error(
        `Unique constraint for table ${args.klass} already exists`
      );
    }

    this.uniqueConstraints.set(
      args.klass,
      UniqueConstraintMetadataFactory.create(args)
    );
  }

  public addField(klass: AnEntity, fieldName: string) {
    const newFields = this.fields.get(klass) ?? [];
    newFields.push(fieldName);

    this.fields.set(klass, newFields);
  }

  public addRelation(args: RelationMetadataArgs) {
    const relation = RelationMetadataFactory.create(args);

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

    // Log both fiels from the relation
    this.addField(args.foreign, args.foreignField);
    this.addField(args.primary, args.primaryField);
  }
}

export const METADATA_STORE = new MetadataStore();
