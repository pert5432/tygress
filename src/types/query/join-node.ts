import { Entity } from "..";
import { ColumnMetadata } from "../../metadata";

export type JoinNode<T extends Entity<unknown>> = {
  klass: T;
  alias: string;
  parentField?: string;

  selectedFields: Map<string, { fullName: string; column: ColumnMetadata }>;

  path: string[];

  idKeys: string[];

  joins: {
    [K in keyof T]?: JoinNode<Entity<unknown>>;
  };

  entitiesByParentsIdPath: Map<string, Entity<unknown>[]>;
  entityByIdPath: Map<string, Entity<unknown>>;
};
