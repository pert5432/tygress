import { ComparisonFactory, JoinNodeFactory } from "../factories";
import { ColumnMetadata, METADATA_STORE, TableMetadata } from "../metadata";
import {
  NotComparisonWrapper,
  ComparisonWrapper,
  ComparisonSqlBuilder,
} from "./comparison";
import {
  Entity,
  Joins,
  SelectArgs,
  ParametrizedCondition,
  Wheres,
  Parametrizable,
  AnEntity,
  SelectTargetArgs,
} from "../types";
import { JoinNode, Query } from "../types/query";
import {
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedConditionWrapper,
} from "../types/where-args";
import { dQ } from "../utils";
import { Order, OrderArgs } from "../types/order-args";

export class SelectSqlBuilder<T extends Entity<unknown>> {
  constructor(private entity: T, private args: SelectArgs<InstanceType<T>>) {
    this.table = METADATA_STORE.getTable(this.entity);

    this.joinNodes = JoinNodeFactory.createRoot(entity);
  }

  private table: TableMetadata;
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];
  private orderBys: string[] = [];

  private joinNodes: JoinNode<T>;

  private params: any[] = [];

  private selectTargets: string[] = [];

  public buildSelect(): Query<T> {
    this.buildJoins();
    this.buildWhereConditions();
    this.buildOrder();

    if (this.args.select) {
      this.selectFieldsFromSelectArg(this.args.select, this.joinNodes);
    } else {
      this.selectFieldsFromJoinNode(this.joinNodes);
    }

    this.selectTargetsFromJoinNodes(this.joinNodes);

    let sql = `SELECT ${this.selectTargets.join(", ")} FROM ${dQ(
      this.table.tablename
    )} ${dQ(this.joinNodes.alias)}`;

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

    return { sql, params: this.params, joinNodes: this.joinNodes };
  }

  private buildWhereConditions(): void {
    if (!this.args.where) {
      return;
    }

    const buildWhere = <E extends Entity<unknown>>(
      table: TableMetadata,
      where: Wheres<E>,
      joinNode: JoinNode<E>
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
            typeof condition === "number" ||
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

    buildWhere(this.table, this.args.where, this.joinNodes);
  }

  private buildJoins(): void {
    if (!this.args?.joins) {
      return;
    }

    const joinTable = <E extends Entity<unknown>>(
      joins: Joins<E>,
      joinNode: JoinNode<E>
    ): void => {
      const currentTable = METADATA_STORE.getTable(joinNode.klass);

      for (const key in joins) {
        const join = joins[key];

        // Get meta needed for join
        const relation = currentTable.relations.get(key);
        if (!relation) {
          throw new Error(
            `No relation found on table ${currentTable}, field ${key}`
          );
        }
        const inverseTable = relation.getOtherTable(currentTable.klass);
        const inverseMeta = METADATA_STORE.getTable(inverseTable);

        const nextJoinNode = JoinNodeFactory.create(
          joinNode,
          inverseTable,
          key,
          relation.type
        );

        joinNode.joins[key] = nextJoinNode;

        // Generate join
        if (join === true || join instanceof Object) {
          // Figure out which join node is foreign/primary and pick aliases for the join based on that
          const [primaryAlias, foreignAlias] =
            relation.primary === joinNode.klass
              ? [joinNode.alias, nextJoinNode.alias]
              : [nextJoinNode.alias, joinNode.alias];

          const comparison = ComparisonFactory.createColCol({
            leftAlias: foreignAlias,
            leftColumn: relation.foreignKey,
            comparator: "eq",
            rightAlias: primaryAlias,
            rightColumn: relation.primaryKey,
          });

          this.sqlJoins.push(
            `INNER JOIN ${dQ(inverseMeta.fullName)} ${dQ(
              nextJoinNode.alias
            )} ON ${comparison.sql()}`
          );
        }

        // Keep processing deeper joins if argument is an object
        if (join instanceof Object) {
          joinTable(join as Joins<typeof inverseTable>, nextJoinNode);
        }
      }
    };

    joinTable(this.args.joins, this.joinNodes);
  }

  private buildOrder(): void {
    if (!this.args?.order) {
      return;
    }

    const createOrder = <E extends AnEntity>(
      order: Order<E>,
      joinNode: JoinNode<E>
    ): void => {
      for (const key in order) {
        const val = order[key];

        if (val === "ASC" || val === "DESC") {
          const column = METADATA_STORE.getColumn(joinNode.klass, key);

          this.orderBys.push(`${dQ(joinNode.alias)}.${dQ(column.name)} ${val}`);
        } else if ((val as any) instanceof Object) {
          const nextJoinNode = joinNode.joins[key] as JoinNode<AnEntity>;

          return createOrder(val as OrderArgs<AnEntity>, nextJoinNode);
        } else {
          throw new Error(`Bogus order by ${val}`);
        }
      }
    };

    return createOrder(this.args.order, this.joinNodes);
  }

  //
  // HELPER FUNCTIONS
  //
  private addParam(val: number | string | boolean): number {
    this.params.push(val);

    return this.params.length;
  }

  private selectFieldsFromJoinNode = <E extends Entity<unknown>>(
    node: JoinNode<E>
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
    joinNode: JoinNode<E>
  ): void {
    for (const key in targets) {
      const target = targets[key];

      if (target === true) {
        const column = METADATA_STORE.getColumn(joinNode.klass, key);

        joinNode.selectField(column);
      } else if ((target as any) instanceof Object) {
        const nextJoinNode = joinNode.joins[key] as JoinNode<AnEntity>;

        return this.selectFieldsFromSelectArg(
          target as SelectTargetArgs<AnEntity>,
          nextJoinNode
        );
      }
    }
  }

  private selectTargetsFromJoinNodes(node: JoinNode<AnEntity>): void {
    for (const { column } of node.selectedFields.values()) {
      this.selectTarget(node, column);
    }

    for (const key in node.joins) {
      this.selectTargetsFromJoinNodes(node.joins[key]!);
    }
  }

  private selectTarget<E extends AnEntity>(
    node: JoinNode<E>,
    c: ColumnMetadata
  ): void {
    this.selectTargets.push(
      `${dQ(node.alias)}.${dQ(c.name)} AS ${dQ(`${node.alias}.${c.fieldName}`)}`
    );
  }
}
