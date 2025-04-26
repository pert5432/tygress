import { JoinStrategy, JoinType } from "./enums";
import { AnEntity, WhereComparator } from "./types";
import { NamedParams } from "./types/named-params";
import {
  JoinImplArgs,
  QueryBuilderGenerics,
  SelectSourceContext,
  SelectSourceKeys,
} from "./types/query-builder";

export class JoinFactory<
  G extends QueryBuilderGenerics,
  A extends string,
  E extends AnEntity
> {
  private targetSelectSourceContext: SelectSourceContext;

  constructor(
    private targetAlias: string,
    targetEntityOrCTE: AnEntity | string,
    private type: JoinType,
    private select: boolean,
    private map: boolean
  ) {
    this.targetSelectSourceContext =
      typeof targetEntityOrCTE === "string"
        ? { type: "cte", name: targetEntityOrCTE, source: Object }
        : { type: "entity", source: targetEntityOrCTE };
  }

  public relation<
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>
  >(parentAlias: K, parentField: F): JoinImplArgs {
    return {
      ...this.baseArgs(),
      strategy: JoinStrategy.RELATION,

      parentAlias: parentAlias.toString(),
      parentField: parentField.toString(),

      ...(this.map
        ? {
            mapToAlias: parentAlias.toString(),
            mapToField: parentField.toString(),
            map: true,
          }
        : { map: false }),
    };
  }

  public sql(sql: string, namedParams?: NamedParams): JoinImplArgs {
    return {
      ...this.baseArgs(),
      strategy: JoinStrategy.SQL,

      sql,
      namedParams,
    };
  }

  public on<
    J extends G["JoinedEntities"] & Record<A, E>,
    K extends keyof J,
    F extends SelectSourceKeys<J[K]>,
    K2 extends keyof J,
    F2 extends SelectSourceKeys<J[K2]>
  >(
    leftAlias: K,
    leftField: F,
    comparator: WhereComparator,
    rightAlias: K2,
    rightField: F2
  ): JoinImplArgs {
    return {
      ...this.baseArgs(),
      strategy: JoinStrategy.COMPARISON,

      leftAlias: leftAlias.toString(),
      leftField: leftField.toString(),
      comparator,
      rightAlias: rightAlias.toString(),
      rightField: rightField.toString(),
    };
  }

  private baseArgs() {
    return {
      type: this.type,

      targetAlias: this.targetAlias,
      targetSelectSourceContext: this.targetSelectSourceContext,

      select: this.select,
    };
  }
}
