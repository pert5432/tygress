import { AnEntity, Entity } from "..";
import { Relation } from "../../enums";
import { ColumnMetadata, METADATA_STORE } from "../../metadata";

export class JoinNode<T extends AnEntity> {
  constructor(klass: T, alias: string) {
    this.klass = klass;
    this.alias = alias;
  }

  // The class that is joined-in
  klass: T;
  // Alias of the joined-in class
  alias: string;

  // Which field on the parent leads to this join
  // Undefined for root node
  parentField?: string;
  relationToParent?: Relation;

  selectedFields: Map<string, { fullName: string; column: ColumnMetadata }> =
    new Map();

  //
  // Data for query runner
  //

  // Keys of ids of all parent nodes, aliased
  idKeys: string[] = [];
  // Instances of this entity that belong to a specific parent entity
  // Indexed by ids of all parent entities to this one
  entitiesByParentsIdPath: Map<string, Entity<unknown>[]> = new Map();
  // Instance of this entity, indexed by ids of all parents + this entity
  entityByIdPath: Map<string, Entity<unknown>> = new Map();

  joins: {
    [K in keyof T]?: JoinNode<Entity<unknown>>;
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
