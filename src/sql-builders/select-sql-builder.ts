import { TargetNodeFactory } from "../factories";
import { METADATA_STORE, TableMetadata } from "../metadata";
import { Entity, SelectQueryArgs, AnEntity } from "../types";
import { TargetNode, Query } from "../types/query";
import { dQ } from "../utils";
import { JoinArg } from "../types/query/join-arg";
import { ParamBuilder } from "./param-builder";
import {
  ColumnSelectTargetSqlBuilder,
  SelectTargetSqlBuilder,
} from "./select-target";

export class SelectSqlBuilder<T extends AnEntity> {
  constructor(
    private args: SelectQueryArgs,
    private paramBuilder: ParamBuilder
  ) {
    const rootJoinArg = args.joins[0]! as JoinArg<T>;

    this.table = METADATA_STORE.getTable(rootJoinArg.klass);

    const rootTargetNode = TargetNodeFactory.createRoot<T>(
      rootJoinArg.klass,
      rootJoinArg.alias
    );

    this.targetNodes = rootTargetNode;
    this.targetNodesByAlias.set(rootJoinArg.alias, rootTargetNode);
  }

  private table: TableMetadata;
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];
  private orderBys: string[] = [];

  private selectTargetSqlBuilders: SelectTargetSqlBuilder[] = [];

  private targetNodes: TargetNode<T>;
  private targetNodesByAlias = new Map<string, TargetNode<AnEntity>>();

  public buildSelect(): Query {
    this.buildJoins();
    this.buildWhereConditions();
    this.buildOrder();

    // Set which fields should be selected
    if (this.args.selects.length) {
      this.registerSelectedFieldsToNodes(this.args.selects);
    } else {
      this.selectFieldsFromJoinNode(this.targetNodes);
    }

    //
    // Build the actual SQL
    //

    let sql = `SELECT ${this.selectTargetSqlBuilders
      .map((e) => e.sql(this.paramBuilder))
      .join(", ")} FROM ${dQ(this.table.tablename)} ${dQ(
      this.targetNodes.alias
    )}`;

    if (this.sqlJoins.length) {
      sql += ` ${this.sqlJoins.join(" ")}`;
    }

    if (this.whereConditions.length) {
      sql += ` WHERE ${this.whereConditions.join(" AND ")}`;
    }

    if (this.orderBys.length) {
      sql += ` ORDER BY ${this.orderBys.join(", ")}`;
    }

    if (this.args.limit) {
      if (this.args.limit < 1) {
        throw new Error(`Bogus limit ${this.args.limit}`);
      }

      sql += ` LIMIT ${this.args.limit}`;
    }

    if (this.args.offset) {
      if (this.args.offset < 0) {
        throw new Error(`Bogus offset ${this.args.offset}`);
      }

      sql += ` OFFSET ${this.args.offset}`;
    }

    return {
      sql,
      params: this.paramBuilder.params,
      joinNodes: this.targetNodes,
    };
  }

  private buildWhereConditions(): void {
    if (!this.args.wheres) {
      return;
    }

    for (const comparison of this.args.wheres) {
      this.whereConditions.push(comparison.sql(this.paramBuilder));
    }
  }

  private buildJoins(): void {
    if (!this.args?.joins) {
      return;
    }

    // Skip first node since its the root
    for (const join of this.args.joins.slice(1)) {
      const tableMeta = METADATA_STORE.getTable(join.klass);

      let nextTargetNode: TargetNode<AnEntity>;
      if (join.parentAlias) {
        const parentTargetNode = this.targetNodesByAlias.get(
          join.parentAlias!
        )!;

        nextTargetNode = TargetNodeFactory.create(
          join.alias,
          parentTargetNode,
          join.klass,
          join.parentField!
        );

        parentTargetNode.joins[join.parentField!] = nextTargetNode;
      } else {
        nextTargetNode = TargetNodeFactory.createRoot(
          join.klass,
          join.alias,
          false
        );
      }

      this.targetNodesByAlias.set(join.alias, nextTargetNode);

      this.sqlJoins.push(
        `INNER JOIN ${dQ(tableMeta.fullName)} ${dQ(
          join.alias
        )} ON ${join.comparison!.sql(this.paramBuilder)}`
      );
    }
  }

  private buildOrder(): void {
    if (!this.args.orderBys.length) {
      return;
    }

    for (const { alias, column, order } of this.args.orderBys) {
      this.orderBys.push(`${dQ(alias)}.${dQ(column.name)} ${order}`);
    }
  }

  //
  // HELPER FUNCTIONS
  //

  // Select all fields that are selectable by default on all join nodes
  private selectFieldsFromJoinNode = <E extends Entity<unknown>>(
    node: TargetNode<E>
  ): void => {
    METADATA_STORE.getTable(node.klass).columnsSelectableByDefault.forEach(
      (c) => node.selectField(c)
    );

    for (const key in node.joins) {
      this.selectFieldsFromJoinNode(node.joins[key]!);
    }
  };

  // Select all fields that are specified to be selected
  private registerSelectedFieldsToNodes(
    targets: SelectTargetSqlBuilder[]
  ): void {
    for (const builder of targets) {
      this.selectTargetSqlBuilders.push(builder);

      if (!(builder instanceof ColumnSelectTargetSqlBuilder)) {
        return;
      }

      const node = this.targetNodesByAlias.get(builder.alias);

      if (!node) {
        throw new Error(`No target with alias ${builder.alias}`);
      }

      node.selectField(builder.column, builder.as);
    }
  }
}
