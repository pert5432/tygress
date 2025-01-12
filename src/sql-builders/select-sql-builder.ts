import { ComparisonFactory, TargetNodeFactory } from "../factories";
import { ColumnMetadata, METADATA_STORE, TableMetadata } from "../metadata";
import {
  NotComparisonWrapper,
  ComparisonWrapper,
  ComparisonSqlBuilder,
} from "./comparison";
import {
  Entity,
  SelectQueryArgs,
  ParametrizedCondition,
  Wheres,
  Parametrizable,
  AnEntity,
  SelectTargetArgs,
} from "../types";
import { TargetNode, Query } from "../types/query";
import {
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedConditionWrapper,
} from "../types/where-args";
import { dQ } from "../utils";
import { OrderArgs } from "../types/order-args";
import { JoinArg } from "../types/query/join-arg";

export class SelectSqlBuilder<T extends AnEntity> {
  constructor(private args: SelectQueryArgs<T>) {
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

  private targetNodes: TargetNode<T>;
  private targetNodesByAlias = new Map<string, TargetNode<AnEntity>>();

  private params: any[] = [];

  private selectTargets: string[] = [];

  public buildSelect(): Query<T> {
    this.buildJoins();
    this.buildWhereConditions();
    this.buildOrder();

    // Set which fields should be selected
    if (this.args.select) {
      this.selectFieldsFromSelectArg(this.args.select, this.targetNodes);
    } else {
      this.selectFieldsFromJoinNode(this.targetNodes);
    }

    // Turn selected fields into SQL statements
    this.selectTargetsFromJoinNodes(this.targetNodes);

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

    return { sql, params: this.params, joinNodes: this.targetNodes };
  }

  private buildWhereConditions(): void {
    if (!this.args.where) {
      return;
    }

    const buildWhere = <E extends Entity<unknown>>(
      table: TableMetadata,
      where: Wheres<E>,
      joinNode: TargetNode<E>
    ): void => {
      for (const fieldName in where) {
        let column = table.columnsMap.get(fieldName);

        // Fetch the column meta from a relation instead
        // Maybe this should be a different branch alltogether (i.e. we want to handle conditions for columns and for relations separately)
        if (!column) {
          const relation = table.relations.get(fieldName);

          if (relation) {
            const { field, klass } = relation.getOtherSide(table.klass);
            const otherTable = METADATA_STORE.getTable(klass);

            column = otherTable.columnsMap.get(field);
          }
        }

        if (!column) {
          throw new Error(
            `Column ${fieldName} not found in table ${table.klass.name}`
          );
        }

        const condition = where[fieldName];

        // Go process conditions for joined entity if the key coresponds to a relation
        const relation = table.relations.get(fieldName);
        if (relation) {
          return buildWhere(
            METADATA_STORE.getTable(relation.getOtherTable(table.klass)),
            condition as Wheres<Entity<unknown>>,
            joinNode.joins[fieldName]!
          );
        }

        const getComparison = (
          condition: ParameterArgs<Parametrizable>
        ): ComparisonSqlBuilder => {
          if ((condition as Object) instanceof ParametrizedCondition) {
            // To get type safety because inference doesn't work here for some reason ¯\_(ツ)_/¯
            const parametrizedCondition =
              condition as ParametrizedCondition<Parametrizable>;

            return ComparisonFactory.createColParam({
              leftAlias: joinNode.alias,
              leftColumn: column.name,
              comparator: parametrizedCondition.comparator,
              paramNumbers: parametrizedCondition.parameters.map((e) =>
                this.addParam(e)
              ),
            });
          } else if (
            condition === "number" ||
            typeof condition === "string" ||
            typeof condition === "boolean"
          ) {
            return ComparisonFactory.createColParam({
              leftAlias: joinNode.alias,
              leftColumn: column.name,
              comparator: "eq",
              paramNumbers: [this.addParam(condition)],
            });
          } else if (
            (condition as Object) instanceof ParametrizedConditionWrapper
          ) {
            const conditionWrapper =
              condition as ParametrizedConditionWrapper<Parametrizable>;

            const comparisons = conditionWrapper.conditions.map((c) =>
              ComparisonFactory.createColParam({
                leftAlias: joinNode.alias,
                leftColumn: column.name,
                comparator: c.comparator,
                paramNumbers: c.parameters.map((e) => this.addParam(e)),
              })
            );

            return new ComparisonWrapper(
              comparisons,
              conditionWrapper.logicalOperator
            );
          } else if ((condition as Object) instanceof NotConditionWrapper) {
            const notConditionWrapper =
              condition as NotConditionWrapper<Parametrizable>;

            return new NotComparisonWrapper(
              getComparison(notConditionWrapper.condition)
            );
          } else {
            throw new Error(`bogus condition ${condition}`);
          }
        };

        this.whereConditions.push(getComparison(condition!).sql());
      }
    };

    buildWhere(this.table, this.args.where, this.targetNodes);
  }

  private buildJoins(): void {
    if (!this.args?.joins) {
      return;
    }

    // Skip first node since its the root
    for (const join of this.args.joins.slice(1)) {
      const parentTargetNode = this.targetNodesByAlias.get(join.parentAlias!)!;
      const tableMeta = METADATA_STORE.getTable(join.klass);

      const nextTargetNode = TargetNodeFactory.create(
        join.alias,
        parentTargetNode,
        join.klass,
        join.parentField!
      );

      parentTargetNode.joins[join.parentField!] = nextTargetNode;
      this.targetNodesByAlias.set(join.alias, nextTargetNode);

      this.sqlJoins.push(
        `INNER JOIN ${dQ(tableMeta.fullName)} ${dQ(
          join.alias
        )} ON ${join.comparison!.sql()}`
      );
    }
  }

  private buildOrder(): void {
    if (!this.args?.order) {
      return;
    }

    const createOrder = <E extends AnEntity>(
      order: OrderArgs<E>,
      joinNode: TargetNode<E>
    ): void => {
      for (const key in order) {
        const val = order[key];

        if (val === "ASC" || val === "DESC") {
          const column = METADATA_STORE.getColumn(joinNode.klass, key);

          this.orderBys.push(`${dQ(joinNode.alias)}.${dQ(column.name)} ${val}`);
        } else if ((val as any) instanceof Object) {
          const nextJoinNode = joinNode.joins[key] as TargetNode<AnEntity>;

          return createOrder(val as OrderArgs<AnEntity>, nextJoinNode);
        } else {
          throw new Error(`Bogus order by ${val}`);
        }
      }
    };

    return createOrder(this.args.order, this.targetNodes);
  }

  //
  // HELPER FUNCTIONS
  //
  private addParam(val: number | string | boolean): number {
    this.params.push(val);

    return this.params.length;
  }

  private selectFieldsFromJoinNode = <E extends Entity<unknown>>(
    node: TargetNode<E>
  ): void => {
    for (const c of METADATA_STORE.getTable(node.klass).columns) {
      if (!c.select) {
        return;
      }

      node.selectField(c);
    }

    for (const key in node.joins) {
      this.selectFieldsFromJoinNode(node.joins[key]!);
    }
  };

  private selectFieldsFromSelectArg<E extends AnEntity>(
    targets: SelectTargetArgs<E>,
    joinNode: TargetNode<E>
  ): void {
    for (const key in targets) {
      const target = targets[key];

      if (target === true) {
        const table = METADATA_STORE.getTable(joinNode.klass);

        const column = table.columnsMap.get(key);
        if (column) {
          joinNode.selectField(column);
        } else {
          // Select next relation by key and all relations under it
          if (table.relations.get(key)) {
            this.selectTargetsFromJoinNodes(joinNode.joins[key]!);
          } else {
            throw new Error(
              `No column or relation found for table ${joinNode.klass.name}, field ${key}`
            );
          }
        }
      } else if ((target as any) instanceof Object) {
        const nextJoinNode = joinNode.joins[key] as TargetNode<AnEntity>;

        return this.selectFieldsFromSelectArg(
          target as SelectTargetArgs<AnEntity>,
          nextJoinNode
        );
      }
    }
  }

  private selectTargetsFromJoinNodes(node: TargetNode<AnEntity>): void {
    for (const target of node.selectedFields.values()) {
      this.selectTarget(node, target.column);
    }

    for (const key in node.joins) {
      this.selectTargetsFromJoinNodes(node.joins[key]!);
    }
  }

  private selectTarget<E extends AnEntity>(
    node: TargetNode<E>,
    c: ColumnMetadata
  ): void {
    this.selectTargets.push(
      `${dQ(node.alias)}.${dQ(c.name)} AS ${dQ(`${node.alias}.${c.fieldName}`)}`
    );
  }
}
