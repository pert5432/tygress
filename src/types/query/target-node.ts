import { AnEntity, Entity } from "..";
import { ColumnMetadata, METADATA_STORE } from "../../metadata";

export class TargetNode<T extends AnEntity> {
  constructor(klass: T, alias: string) {
    this.klass = klass;
    this.alias = alias;
  }

  // The class that is joined-in
  klass: T;
  // Alias of the joined-in class
  alias: string;

  select: boolean;

  // Undefined for root node
  // Which field on the parent leads to this join
  parentField?: string;

  parentFieldIsArray?: boolean;

  primaryKeyColumn: ColumnMetadata;

  selectedFields: {
    fieldName: string;
    fullName: string;
    column: ColumnMetadata;
    as?: string;
  }[] = [];

  // Keys of ids of all parent nodes, aliased
  idKeys: string[] = [];
  // Instances of this entity that belong to a specific parent entity
  // Indexed by ids of all parent entities to this one
  entitiesByParentsIdPath: Map<string, Entity<unknown>[]> = new Map();
  // Instance of this entity, indexed by ids of all parents + this entity
  entityByIdPath: Map<string, Entity<unknown>> = new Map();

  joins: {
    [key: string]: TargetNode<Entity<unknown>>;
  } = {};

  public selectField(column: ColumnMetadata, as?: string): void {
    // Don't add the exactly same field twice
    if (
      this.selectedFields.find(
        (e) => e.fieldName === column.fieldName && e.as === as
      )
    ) {
      return;
    }

    const fullName = as?.length ? as : `${this.alias}.${column.fieldName}`;

    this.selectedFields.push({
      fieldName: column.fieldName,
      fullName: fullName,
      column,
      as,
    });
  }

  public selectAllFields(): void {
    const table = METADATA_STORE.getTable(this.klass);

    table.columnsSelectableByDefault.forEach((c) => this.selectField(c));
  }
}
