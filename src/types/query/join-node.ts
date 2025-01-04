import { Entity } from "..";
import { Relation } from "../../enums";
import { ColumnMetadata } from "../../metadata";

export type JoinNode<T extends Entity<unknown>> = {
  // The class that is joined-in
  klass: T;
  // Alias of the joined-in class
  alias: string;

  // Which field on the parent leads to this join
  // Undefined for root node
  parentField?: string;
  relationToParent?: Relation;

  selectedFields: Map<string, { fullName: string; column: ColumnMetadata }>;

  // Path of keys from root node
  path: string[];

  //
  // Data for query runner
  //

  // Keys of ids of all parent nodes, aliased
  idKeys: string[];
  // Instances of this entity that belong to a specific parent entity
  // Indexed by ids of all parent entities to this one
  entitiesByParentsIdPath: Map<string, Entity<unknown>[]>;
  // Instance of this entity, indexed by ids of all parents + this entity
  entityByIdPath: Map<string, Entity<unknown>>;

  joins: {
    [K in keyof T]?: JoinNode<Entity<unknown>>;
  };
};
