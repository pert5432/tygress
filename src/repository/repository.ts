import { Client } from "pg";
import {
  AnEntity,
  Joins,
  OrderArgs,
  SelectArgs,
  SelectQueryArgs,
  SelectTargetArgs,
  Wheres,
} from "../types";
import { SelectSqlBuilder } from "../sql-builders/select-sql-builder";
import { EntitiesQueryRunner } from "../entities-query-runner";
import { JoinArg } from "../types/query/join-arg";
import { METADATA_STORE, TableMetadata } from "../metadata";
import {
  ColumnIdentifierSqlBuilderFactory,
  ComparisonFactory,
  JoinArgFactory,
  OrderByExpressionSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
} from "../factories";
import { entityNameToAlias } from "../utils";
import {
  ComparisonSqlBuilder,
  ParamBuilder,
  SelectTargetSqlBuilder,
} from "../sql-builders";
import { JoinNodeFactory } from "../factories/repository";
import { JoinNode } from ".";
import { QueryResultType } from "../enums";
import { OrderByExpressionSqlBuilder } from "../sql-builders/order-by-expression";

// TODO: Replace with usage of SelectQueryArgs type
type ArgsTransformations = {
  joins: JoinArg<AnEntity>[];
  wheres: ComparisonSqlBuilder[];
  selects: SelectTargetSqlBuilder[];
  orderBys: OrderByExpressionSqlBuilder[];
};

export abstract class Repository {
  public static async select<T extends AnEntity>(
    client: Client,
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    const paramBuilder = new ParamBuilder();

    const transformedArgs = this.transformArgs(
      entity,
      args.joins,
      args.where,
      args.select,
      args.order
    );

    const queryArgs: SelectQueryArgs = {
      ...args,
      ...transformedArgs,
      resultType: QueryResultType.ENTITIES,
    };

    const query = new SelectSqlBuilder<T>(
      queryArgs,
      paramBuilder
    ).buildSelect();

    return await new EntitiesQueryRunner<T>(client, query).run();
  }

  private static transformArgs<T extends AnEntity>(
    entity: T,
    joins: Joins<InstanceType<T>> = {},
    wheres: Wheres<InstanceType<T>> = {},
    selects: SelectTargetArgs<InstanceType<T>> = {},
    orderBys: OrderArgs<InstanceType<T>> = {}
  ): ArgsTransformations {
    const rootEntityMeta = METADATA_STORE.getTable(entity);

    const rootNode = JoinNodeFactory.createRoot(rootEntityMeta);

    this.nodesFromJoins(joins, rootNode, rootEntityMeta);
    this.nodesFromWheres(wheres, rootNode, rootEntityMeta);
    this.nodesFromSelects(selects, rootNode, rootEntityMeta);
    this.nodesFromOrderBys(orderBys, rootNode, rootEntityMeta);

    const joinsResult: JoinArg<AnEntity>[] = [
      JoinArgFactory.createRoot(entity, entityNameToAlias(entity.name)),
    ];
    const wheresResult: ComparisonSqlBuilder[] = [];
    const selectsResult: SelectTargetSqlBuilder[] = [];
    const orderBysResult: OrderByExpressionSqlBuilder[] = [];

    this.processJoins(joinsResult, rootNode);
    this.processWheres(wheresResult, wheres, rootNode);
    this.processSelects(
      selectsResult,
      selects,
      rootNode,
      Object.keys(selects).length < 1
    );
    this.processOrderBys(orderBysResult, orderBys, rootNode);

    return {
      joins: joinsResult,
      wheres: wheresResult,
      selects: selectsResult,
      orderBys: orderBysResult,
    };
  }

  //
  // Functions to build abstract join tree from SelectArgs
  //

  private static nodesFromJoins<T extends AnEntity>(
    joinArgs: Joins<InstanceType<T>> | boolean,
    parentNode: JoinNode,
    parentTableMeta: TableMetadata
  ): void {
    if (!(joinArgs instanceof Object)) {
      return;
    }

    for (const key in joinArgs) {
      const join = joinArgs[key];

      const nextEntity = this.getInverseTableOfRelation(parentTableMeta, key);
      const nextEntityMeta = METADATA_STORE.getTable(nextEntity);

      // Add the new join node to parent node if there isn't a node in there already
      if (parentNode.relations[key]) {
        // Keep processing deeper joins
        return this.nodesFromJoins(
          join!,
          parentNode.relations[key],
          nextEntityMeta
        );
      }

      const nextJoinNode = JoinNodeFactory.createFromJoin(
        nextEntityMeta,
        parentNode.alias
      );

      parentNode.relations[key] = nextJoinNode;

      // Keep processing deeper joins
      return this.nodesFromJoins(join!, nextJoinNode, nextEntityMeta);
    }
  }

  private static nodesFromWheres<T extends AnEntity>(
    whereArgs: Wheres<InstanceType<T>>,
    parentNode: JoinNode,
    parentTableMeta: TableMetadata
  ): void {
    // TODO: safeguard against trying to process a ParametrizedCondition as a join?

    for (const key in whereArgs) {
      if (!parentTableMeta.relations.get(key)) {
        continue;
      }

      const nextEntity = this.getInverseTableOfRelation(parentTableMeta, key);
      const nextEntityMeta = METADATA_STORE.getTable(nextEntity);

      // This relation is already added, keep processing WHEREs deeper
      if (parentNode.relations[key]) {
        return this.nodesFromWheres(
          whereArgs[key] as Wheres<InstanceType<AnEntity>>,
          parentNode.relations[key],
          nextEntityMeta
        );
      }

      const nextNode = JoinNodeFactory.create(nextEntityMeta, parentNode.alias);

      parentNode.relations[key] = nextNode;

      return this.nodesFromWheres(
        whereArgs[key] as Wheres<InstanceType<AnEntity>>,
        nextNode,
        nextEntityMeta
      );
    }
  }

  private static nodesFromSelects<T extends AnEntity>(
    selectArgs: SelectTargetArgs<InstanceType<T>>,
    parentNode: JoinNode,
    parentTableMeta: TableMetadata
  ): void {
    if (!(selectArgs instanceof Object)) {
      return;
    }

    for (const key in selectArgs) {
      if (!parentTableMeta.relations.get(key)) {
        continue;
      }

      const nextEntity = this.getInverseTableOfRelation(parentTableMeta, key);
      const nextEntityMeta = METADATA_STORE.getTable(nextEntity);

      // This relation is already added, keep processing SELECTs deeper
      if (parentNode.relations[key]) {
        return this.nodesFromSelects(
          selectArgs[key] as SelectTargetArgs<InstanceType<T>>,
          parentNode.relations[key],
          nextEntityMeta
        );
      }

      const nextNode = JoinNodeFactory.create(nextEntityMeta, parentNode.alias);

      parentNode.relations[key] = nextNode;

      return this.nodesFromSelects(
        selectArgs[key] as SelectTargetArgs<InstanceType<T>>,
        nextNode,
        nextEntityMeta
      );
    }
  }

  private static nodesFromOrderBys<T extends AnEntity>(
    orderByArgs: OrderArgs<InstanceType<T>>,
    parentNode: JoinNode,
    parentTableMeta: TableMetadata
  ): void {
    if (!(orderByArgs instanceof Object)) {
      return;
    }

    for (const key in orderByArgs) {
      if (!parentTableMeta.relations.get(key)) {
        continue;
      }

      const nextEntity = this.getInverseTableOfRelation(parentTableMeta, key);
      const nextEntityMeta = METADATA_STORE.getTable(nextEntity);

      // This relation is already added, keep processing SELECTs deeper
      if (parentNode.relations[key]) {
        return this.nodesFromOrderBys(
          orderByArgs[key] as OrderArgs<InstanceType<AnEntity>>,
          parentNode.relations[key],
          nextEntityMeta
        );
      }

      const nextNode = JoinNodeFactory.create(nextEntityMeta, parentNode.alias);

      parentNode.relations[key] = nextNode;

      return this.nodesFromOrderBys(
        orderByArgs[key] as OrderArgs<InstanceType<AnEntity>>,
        nextNode,
        nextEntityMeta
      );
    }
  }

  //
  // Functions to convert abstract join tree to actual SQL builder args
  //

  private static processJoins(
    joinsResult: JoinArg<AnEntity>[],
    parentNode: JoinNode
  ): void {
    const parentTableMeta = parentNode.entityMeta;

    for (const key in parentNode.relations) {
      // Get meta needed for join
      const relation = parentTableMeta.relations.get(key);
      if (!relation) {
        throw new Error(
          `No relation found on table ${parentTableMeta}, field ${key}`
        );
      }

      // Table we are joining in
      const inverseTable = relation.getOtherTable(parentTableMeta.klass);

      const nextJoinArgAlias = `${parentNode.alias}_${entityNameToAlias(
        inverseTable.name
      )}`;

      const comparison = ComparisonFactory.createJoin(
        parentNode.alias,
        parentTableMeta.klass,
        nextJoinArgAlias,
        relation
      );

      const nextJoinArg = JoinArgFactory.create(
        parentNode.alias,
        key,
        inverseTable,
        nextJoinArgAlias,
        comparison
      );

      joinsResult.push(nextJoinArg);

      // Keep processing deeper joins
      this.processJoins(joinsResult, parentNode.relations[key]!);
    }
  }

  private static processWheres(
    wheresResult: ComparisonSqlBuilder[],
    whereArgs: Wheres<AnEntity>,
    parentNode: JoinNode
  ): void {
    const parentTableMeta = parentNode.entityMeta;

    for (const key in whereArgs) {
      const column = parentTableMeta.columnsMap.get(key);

      if (!column) {
        const relation = parentTableMeta.relations.get(key);

        // If the field is a relation we go next
        // The condition will get processed in the next level, based on joins
        if (relation) {
          const nextNode = parentNode.relations[key];

          if (!nextNode) {
            throw new Error(
              `No relation for ${JSON.stringify(parentNode)}, key ${key}`
            );
          }

          this.processWheres(wheresResult, whereArgs[key]!, nextNode);

          continue;
        }

        // If no column or relation was found we throw because this condition is bogus
        throw new Error(
          `No column found in table ${parentTableMeta.klass.name}, with fieldName ${key}`
        );
      }

      wheresResult.push(
        ComparisonFactory.createFromConditionIdentifier(
          ColumnIdentifierSqlBuilderFactory.createColumnMeta(
            parentNode.alias,
            column
          ),
          whereArgs[key]!
        )
      );
    }
  }

  private static processSelects(
    selectsResult: SelectTargetSqlBuilder[],
    selectArgs: SelectTargetArgs<AnEntity>,
    parentNode: JoinNode,
    selectAll: boolean
  ): void {
    const parentTableMeta = parentNode.entityMeta;

    // Select all explicitly joined tables
    if (selectAll) {
      // This node is not explicitly joined so no nodes under it can be either, bail out
      if (!parentNode.explicitlyJoined) {
        return;
      }

      // Select all columns
      selectsResult.push(
        ...parentTableMeta.columnsSelectableByDefault.map((column) =>
          SelectTargetSqlBuilderFactory.createColumnIdentifier(
            ColumnIdentifierSqlBuilderFactory.createColumnMeta(
              parentNode.alias,
              column
            ),
            `${parentNode.alias}.${column.fieldName}`
          )
        )
      );

      // Keep processing further by join nodes
      for (const key in parentNode.relations) {
        this.processSelects(
          selectsResult,
          selectArgs[key] ?? {},
          parentNode.relations[key]!,
          selectAll
        );
      }

      return;
    }

    // Select individual desired fields
    for (const key in selectArgs) {
      const column = parentTableMeta.columnsMap.get(key);
      const relation = parentTableMeta.relations.get(key);

      if (!column && !relation) {
        throw new Error(
          `No column or relation found for entity ${parentTableMeta.klass}, field name ${key}`
        );
      }

      if (selectArgs[key] === true) {
        if (column) {
          selectsResult.push(
            SelectTargetSqlBuilderFactory.createColumnIdentifier(
              ColumnIdentifierSqlBuilderFactory.createColumnMeta(
                parentNode.alias,
                column
              ),
              `${parentNode.alias}.${column.fieldName}`
            )
          );
        } else {
          selectsResult.push(
            ...parentTableMeta.columnsSelectableByDefault.map((column) =>
              SelectTargetSqlBuilderFactory.createColumnIdentifier(
                ColumnIdentifierSqlBuilderFactory.createColumnMeta(
                  parentNode.alias,
                  column
                ),
                `${parentNode.alias}.${column.fieldName}`
              )
            )
          );
        }
        // arg is an object
      } else {
        if (relation) {
          const nextNode = parentNode.relations[key];

          if (!nextNode) {
            throw new Error(
              `No join node for ${parentTableMeta.klass.name}, field name ${key}`
            );
          }

          this.processSelects(
            selectsResult,
            selectArgs[key]!,
            nextNode,
            selectAll
          );
        } else {
          throw new Error(
            `Can't sub-select from a column, entity ${parentTableMeta.klass.name}, field name ${key}`
          );
        }
      }
    }
  }

  private static processOrderBys(
    orderBysResult: OrderByExpressionSqlBuilder[],
    orderByArgs: OrderArgs<AnEntity>,
    parentNode: JoinNode
  ): void {
    const parentEntityMeta = parentNode.entityMeta;

    for (const key in orderByArgs) {
      const order = orderByArgs[key]!;

      if (typeof order === "string") {
        if (!["ASC", "DESC"].includes(order)) {
          throw new Error(`Invalid order argument ${order}`);
        }

        const column = parentEntityMeta.columnsMap.get(key);
        if (!column) {
          throw new Error(
            `No column found for entity ${parentEntityMeta.klass.name}, field name ${key}`
          );
        }

        const columnIdentifier =
          ColumnIdentifierSqlBuilderFactory.createColumnMeta(
            parentNode.alias,
            column
          );

        orderBysResult.push(
          OrderByExpressionSqlBuilderFactory.create(
            columnIdentifier,
            // What is type inferrence? ¯\_(ツ)_/¯
            order as "ASC" | "DESC"
          )
        );

        continue;
      } else {
        const relation = parentEntityMeta.relations.get(key);

        if (!relation) {
          throw new Error(
            `No relation found for table ${parentEntityMeta.klass.name}, field name ${key}`
          );
        }

        const nextNode = parentNode.relations[key];
        if (!nextNode) {
          throw new Error(
            `No join node for entity ${parentEntityMeta.klass.name}, field name ${key}`
          );
        }

        this.processOrderBys(orderBysResult, order, nextNode);
      }
    }
  }

  //
  // Utils
  //
  private static getInverseTableOfRelation(
    parentTableMeta: TableMetadata,
    fieldName: string
  ): AnEntity {
    const relation = parentTableMeta.relations.get(fieldName);
    if (!relation) {
      throw new Error(
        `No relation found on table ${parentTableMeta}, field ${fieldName}`
      );
    }

    return relation.getOtherTable(parentTableMeta.klass);
  }
}
