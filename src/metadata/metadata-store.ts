import "reflect-metadata";
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
import { AnEntity } from "../types";
import { UniqueConstraintMetadata } from "./unique-constraint";

class MetadataStore {
  public tables = new Map<AnEntity, TableMetadata>();
  public columns = new Map<AnEntity, ColumnMetadata[]>();

  public relations: RelationMetadata[] = [];

  public uniqueConstraints = new Map<
    AnEntity,
    UniqueConstraintMetadata<AnEntity>
  >();

  // All fields which are decorated by our decorators
  public fields = new Map<AnEntity, string[]>();

  private relationArgs: RelationMetadataArgs[] = [];

  //
  // Getters
  //
  public getTable<T extends AnEntity>(table: T): TableMetadata {
    const res = this.tables.get(table as AnEntity);
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
      uniqueConstraint
    );

    this.tables.set(metadata.klass, metadata);
  }

  public addColumn<T>(args: ColumnMetadataArgs<T>): void {
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
    this.relationArgs.push(args);
  }

  public finalize(_entities: AnEntity[]): void {
    this.createRelations();

    this.registerRelationsToEntities();

    this.registerArrayFields();
  }

  // Creates relation metadata from relation args
  private createRelations(): void {
    for (const args of this.relationArgs) {
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

      // TODO: handle 1-1 relations by finding inverse as above
      //   on adding new relation verify one side specifies inverse key
      //     (if inverse relation found ensure either new or old specifies inverse key, not both)

      // Finally insert new relation into the array
      this.relations.push(relation);

      // Log both fiels from the relation
      this.addField(args.foreign(), args.foreignField);
      this.addField(args.primary(), args.primaryField);
    }
  }

  // Adds info about relations to entity metadata
  private registerRelationsToEntities(): void {
    for (const relation of this.relations) {
      // Register relation to foreign tables meta
      const foreignMeta = this.getTable(relation.foreign);
      if (!foreignMeta.columnsMap.get(relation.foreignKey)) {
        throw new Error(
          `No column found for entity ${foreignMeta.klass.name}, field name ${relation.foreignKey}`
        );
      }
      foreignMeta.relations.set(relation.foreignField, relation);

      // Register relation to primary tables meta
      const primaryMeta = this.getTable(relation.primary);
      if (!primaryMeta.columnsMap.get(relation.primaryKey)) {
        throw new Error(
          `No column found for entity ${primaryMeta.klass.name}, field name ${relation.primaryKey}`
        );
      }
      primaryMeta.relations.set(relation.primaryField, relation);
    }
  }

  // Adds info about which fields are arrays to entity metadata
  private registerArrayFields(): void {
    for (const entity of this.tables.values()) {
      const instance = new entity.klass();
      for (const field of this.fields.get(entity.klass) ?? []) {
        if (
          Reflect.getMetadata("design:type", instance as any, field) === Array
        ) {
          entity.arrayFields.add(field);
        }
      }
    }
  }
}

export const METADATA_STORE = new MetadataStore();
