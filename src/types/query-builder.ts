import { JoinStrategy, JoinType } from "../enums";
import { AnEntity } from "./entity";
import { NamedParams } from "./named-params";
import { WhereComparator } from "./where-comparator";

export type QueryBuilderGenerics = {
  RootEntity: AnEntity;
  JoinedEntities: Record<string, SelectSource>;
  CTEs: Record<string, SelectSource>;
  SelectedEntities: Record<string, SelectSource>;
  ExplicitSelects: Record<string, any>;
};

export type SourcesContext<G extends QueryBuilderGenerics> = Record<
  keyof (G["JoinedEntities"] & G["CTEs"]),
  SelectSourceContext
>;

export type Update<
  Input extends QueryBuilderGenerics,
  UpdateKey extends keyof Input,
  UpdateValue extends Input[UpdateKey]
> = Omit<Input, UpdateKey> & Record<UpdateKey, UpdateValue>;

export type CteSelectSource = Record<string, any> & (new () => any);
export type SelectSource = AnEntity | CteSelectSource;

export type SelectSourceContext =
  | { type: "entity"; source: AnEntity }
  | { type: "cte"; name: string; source: CteSelectSource };

export type SelectSourceField<
  E extends SelectSource,
  K extends keyof E
> = E extends AnEntity ? InstanceType<E>[K] : E[K];

export type SelectSourceKeys<S extends SelectSource> = S extends AnEntity
  ? keyof InstanceType<S>
  : keyof S;

export type Stringify<T> = T extends string ? T : never;

export type JoinImplArgs = {
  targetAlias: string;
  targetSelectSourceContext: SelectSourceContext;

  select: boolean;

  type: JoinType;
} & (
  | {
      strategy: JoinStrategy.RELATION;

      parentAlias: string;
      parentField: string;
    }
  | {
      strategy: JoinStrategy.SQL;

      sql: string;
      namedParams?: NamedParams;
      parentAlias?: string;
      parentField?: string;
    }
  | {
      strategy: JoinStrategy.COMPARISON;

      leftAlias: string;
      leftField: string;
      comparator: WhereComparator;
      rightAlias: string;
      rightField: string;
    }
);
