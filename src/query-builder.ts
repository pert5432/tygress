import { ComparisonFactory, JoinNodeFactory } from "./factories";
import { METADATA_STORE, TableMetadata } from "./metadata";
import {
  Entity,
  Joins,
  SelectOptions,
  ParametrizedCondition,
  Wheres,
  Comparison,
} from "./types";
import { JoinNode, Query } from "./types/query";
import { dQ } from "./utils";

export class QueryBuilder<T extends Entity<unknown>> {
  constructor(
    private entity: T,
    private options: SelectOptions<InstanceType<T>>
  ) {
    this.table = METADATA_STORE.getTable(this.entity);

    this.joinNodes = JoinNodeFactory.createRoot(entity);
  }

  private table: TableMetadata;
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];

  private joinNodes: JoinNode<T>;

  private params: any[] = [];

  public buildSelect(): Query<T> {
    this.buildJoins();
    this.buildWhereConditions();

    const targets: string[] = [];

    const processJoinNode = <E extends Entity<unknown>>(
      node: JoinNode<E>
    ): void => {
      for (const c of METADATA_STORE.getTable(node.klass).columns) {
        if (!c.select) {
          return;
        }

        targets.push(
          `${dQ(node.alias)}.${dQ(c.name)} AS ${dQ(
            `${node.alias}.${c.fieldName}`
          )}`
        );

        node.selectedFields.set(c.fieldName, {
          fullName: `${node.alias}.${c.fieldName}`,
          column: c,
        });
      }

      for (const key in node.joins) {
        processJoinNode(node.joins[key]!);
      }
    };

    processJoinNode(this.joinNodes);

    let sql = `SELECT ${targets} FROM ${dQ(this.table.tablename)} ${dQ(
      this.joinNodes.alias
    )}`;

    if (this.sqlJoins.length) {
      sql += ` ${this.sqlJoins.join(" ")}`;
    }

    if (this.whereConditions.length) {
      sql += " WHERE " + this.whereConditions.join(" AND ");
    }

    return { sql, params: this.params, joinNodes: this.joinNodes };
  }

  private buildWhereConditions(): void {
    if (!this.options.where) {
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
            joinNode.joins[fieldName as keyof E]!
          );
        }

        // Build comparison based on args
        let comparison: Comparison;
        if ((condition as any) instanceof ParametrizedCondition) {
          comparison = ComparisonFactory.createColParam({
            leftAlias: joinNode.alias,
            leftColumn: column.name,
            comparator: condition.condition,
            paramNumbers: [this.addParam(condition.parameter)],
          });
        } else if (
          typeof condition === "number" ||
          typeof condition === "string" ||
          typeof condition === "boolean"
        ) {
          comparison = ComparisonFactory.createColParam({
            leftAlias: joinNode.alias,
            leftColumn: column.name,
            comparator: "eq",
            paramNumbers: [this.addParam(condition)],
          });
        } else {
          throw new Error(`bogus condition ${condition}`);
        }

        this.whereConditions.push(comparison.sql());
      }
    };

    buildWhere(this.table, this.options.where, this.joinNodes);
  }

  private buildJoins(): void {
    if (!this.options?.joins) {
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

    joinTable(this.options.joins, this.joinNodes);
  }

  private addParam(val: any): number {
    this.params.push(val);

    return this.params.length;
  }
}
