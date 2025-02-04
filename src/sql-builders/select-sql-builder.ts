import { TargetNodeFactory } from "../factories";
import { ColumnMetadata, METADATA_STORE, TableMetadata } from "../metadata";
import { Entity, SelectQueryArgs, AnEntity, SelectQueryTarget } from "../types";
import { TargetNode, Query } from "../types/query";
import { dQ } from "../utils";
import { JoinArg } from "../types/query/join-arg";
import { ParamBuilder } from "./param-builder";

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
  private selectTargets: string[] = [];
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];
  private orderBys: string[] = [];

  private targetNodes: TargetNode<T>;
  private targetNodesByAlias = new Map<string, TargetNode<AnEntity>>();

  public buildSelect(): Query {
    this.buildJoins();
    this.buildWhereConditions();
    this.buildOrder();

    // Set which fields should be selected
    if (this.args.selects.length) {
      this.selectFieldsFromSelectTargets(this.args.selects);
    } else {
      this.selectFieldsFromJoinNode(this.targetNodes);
    }

    // Turn selected fields into SQL statements
    this.selectedFieldsToSqlTargets(this.targetNodes);

    let sql = `SELECT ${this.selectTargets.join(", ")} FROM ${dQ(
      this.table.tablename
    )} ${dQ(this.targetNodes.alias)}`;

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
        throw new Error(`Bogus limit ${this.args.offset}`);
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

  private selectFieldsFromSelectTargets(targets: SelectQueryTarget[]): void {
    for (const target of targets) {
      const node = this.targetNodesByAlias.get(target.alias);

      if (!node) {
        throw new Error(`No target with alias ${target.alias}`);
      }

      node.selectField(target.column);
    }
  }

  private selectedFieldsToSqlTargets(node: TargetNode<AnEntity>): void {
    for (const target of node.selectedFields.values()) {
      this.selectTarget(node.alias, target.column);
    }

    for (const key in node.joins) {
      this.selectedFieldsToSqlTargets(node.joins[key]!);
    }
  }

  private selectTarget(alias: string, c: ColumnMetadata): void {
    this.selectTargets.push(
      `${dQ(alias)}.${dQ(c.name)} AS ${dQ(`${alias}.${c.fieldName}`)}`
    );
  }
}
