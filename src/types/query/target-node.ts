import { AnEntity } from "..";
import { ColumnMetadata } from "../../metadata";
import { PathMap } from "../../utils";

export class TargetNode {
  constructor(klass: AnEntity, alias: string) {
    this.klass = klass;
    this.alias = alias;
  }

  // The class that is joined-in
  klass: AnEntity;
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

  // Existence of this entity, indexed by ids of all parents + this entity
  entityByIdPath: PathMap<InstanceType<AnEntity>>;

  joins: {
    [key: string]: TargetNode;
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
