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

  // Undefined for root node
  // Which field on the parent leads to this join
  parentField?: string;

  selectedFields: Map<string, { fullName: string; column: ColumnMetadata }> =
    new Map();

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

  public selectField(column: ColumnMetadata): void {
    if (this.selectedFields.has(column.fieldName)) {
      return;
    }

    this.selectedFields.set(column.fieldName, {
      fullName: `${this.alias}.${column.fieldName}`,
      column,
    });
  }

  public selectAllFields(): void {
    const table = METADATA_STORE.getTable(this.klass);

    for (const column of table.columns) {
      if (column.select) {
        this.selectField(column);
      }
    }
  }
}
