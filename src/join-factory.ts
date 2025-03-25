import { JoinStrategy, JoinType } from "./enums";
import { AnEntity, WhereComparator } from "./types";
import { NamedParams } from "./types/named-params";
import {
  JoinImplArgs,
  QueryBuilderGenerics,
  SelectSourceKeys,
} from "./types/query-builder";

export class JoinFactory<G extends QueryBuilderGenerics> {
  constructor(
    private targetAlias: string,
    private targetEntity: AnEntity,
    private type: JoinType,
    private select: boolean
  ) {}

  private baseArgs() {
    return {
      type: this.type,

      targetAlias: this.targetAlias,
      targetEntity: this.targetEntity,

      select: this.select,
    };
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
    K extends keyof G["JoinedEntities"],
    F extends SelectSourceKeys<G["JoinedEntities"][K]>,
    K2 extends keyof G["JoinedEntities"],
    F2 extends SelectSourceKeys<G["JoinedEntities"][K2]>
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
}
