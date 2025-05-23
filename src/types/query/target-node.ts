import { AnEntity } from "..";
import { ColumnMetadata } from "../../metadata";

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
    selectTarget: string;
  }[] = [];

  // Keys of ids of all parent nodes, aliased
  idKeys: string[] = [];
  // Instances of this entity that belong to a specific parent entity
  // Indexed by ids of all parent entities to this one
  entitiesByParentsIdPath: Map<string, AnEntity[]> = new Map();
  // Instance of this entity, indexed by ids of all parents + this entity
  entityByIdPath: Map<string, AnEntity> = new Map();

  joins: {
    [key: string]: TargetNode<AnEntity>;
  } = {};

  public selectField(fieldName: string, selectTarget: string): void {
    // Don't add the exactly same field twice
    if (
      this.selectedFields.find(
        (e) => e.fieldName === fieldName && e.selectTarget === selectTarget
      )
    ) {
      return;
    }

    this.selectedFields.push({
      fieldName,
      selectTarget,
    });
  }
}
