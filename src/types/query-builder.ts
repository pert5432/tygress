import { JoinStrategy, JoinType } from "../enums";
import { AnEntity } from "./entity";
import { NamedParams } from "./named-params";
import { Parametrizable } from "./parametrizable";
import { WhereComparator } from "./where-comparator";

export type QueryBuilderGenerics = {
  RootEntity: AnEntity;
  JoinedEntities: Record<string, SelectSource>;
  CTEs: Record<string, SelectSource>;
  ExplicitSelects: Record<string, any>;
};

export type SourcesContext<G extends QueryBuilderGenerics> = Record<
  keyof (G["JoinedEntities"] & G["CTEs"]),
  SelectSourceContext
>;

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
  | { map: true; mapToAlias: string; mapToField: string }
  | { map?: false; mapToAlias?: string; mapToField?: string }
) &
  (
    | {
        strategy: JoinStrategy.RELATION;

        parentAlias: string;
        parentField: string;
      }
    | {
        strategy: JoinStrategy.SQL;

        sql: string;
        namedParams?: NamedParams;
      }
    | {
        strategy: JoinStrategy.COMPARISON;

        leftAlias: string;
        leftField: string;
        comparator: WhereComparator;
        rightAlias: string;
        rightField: string;
      }
    | { strategy: JoinStrategy.CROSS; type: JoinType.CROSS }
  );

type IsClass<T> = T extends Parametrizable
  ? false
  : T extends object
  ? T extends (...args: any) => any
    ? true
    : T extends new (...args: any) => any
    ? true
    : T extends { constructor: Function }
    ? true
    : T extends Array<infer I>
    ? IsClass<I>
    : false
  : false;

export type FlattenSelectSources<
  T extends { [key: string]: SelectSource },
  K = keyof T
> = K extends string
  ? {
      [F in SelectSourceKeys<T[K]> as F extends string
        ? // Make sure the field is not a function
          IsClass<SelectSourceField<T[K], Stringify<F>>> extends false
          ? `${K}.${F}`
          : never
        : never]: SelectSourceField<T[K], Stringify<F>>;
    }
  : never;
