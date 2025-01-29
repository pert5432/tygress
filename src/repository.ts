import { Client } from "pg";
import {
  AnEntity,
  Joins,
  OrderArgs,
  SelectArgs,
  SelectQueryArgs,
  SelectQueryOrder,
  SelectQueryTarget,
  SelectTargetArgs,
  Wheres,
} from "./types";
import { SelectSqlBuilder } from "./sql-builders/select-sql-builder";
import { QueryRunner } from "./query-runner";
import { JoinArg } from "./types/query/join-arg";
import { METADATA_STORE, TableMetadata } from "./metadata";
import { ComparisonFactory, JoinArgFactory } from "./factories";
import { entityNameToAlias } from "./utils";
import { ComparisonSqlBuilder, ParamBuilder } from "./sql-builders";

type ArgsTransformations = {
  joins: JoinArg<AnEntity>[];
  wheres: ComparisonSqlBuilder[];
  selects: SelectQueryTarget[];
  orderBys: SelectQueryOrder[];
};

type JoinNode = {
  alias: string;

  relations: {
    [key: string]: JoinNode;
  };
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
    };

    const query = new SelectSqlBuilder<T>(
      queryArgs,
      paramBuilder
    ).buildSelect();

    return await new QueryRunner(client, query).run();
  }

  private static transformArgs<T extends AnEntity>(
    entity: T,
    joins?: Joins<InstanceType<T>>,
    wheres?: Wheres<InstanceType<T>>,
    selects?: SelectTargetArgs<InstanceType<T>>,
    orders?: OrderArgs<InstanceType<T>>
  ): ArgsTransformations {
    const data: ArgsTransformations = {
      joins: [],
      wheres: [],
      selects: [],
      orderBys: [],
    };

    const rootNode: JoinNode = {
      alias: entityNameToAlias(entity.name),
      relations: {},
    };

    const rootTableMeta = METADATA_STORE.getTable(entity);

    this.nodesFromJoins(joins ?? {}, rootNode, rootTableMeta);
    this.nodesFromWheres(wheres ?? {}, rootNode, rootTableMeta);
    this.nodesFromSelects(selects ?? {}, rootNode, rootTableMeta);
    this.nodesFromOrderBys(orders ?? {}, rootNode, rootTableMeta);

    if (!joins) {
      return data;
    }

    data.joins.push(
      JoinArgFactory.createRoot(entity, entityNameToAlias(entity.name))
    );

    this.processLevel(data, data.joins[0]!, joins, wheres, selects, orders);

    return data;
  }

  private static nodesFromJoins<T extends AnEntity>(
    joinArgs: Joins<InstanceType<T>>,
    parentNode: JoinNode,
    parentTableMeta: TableMetadata
  ): void {
    if (!(joinArgs instanceof Object)) {
      return;
    }

    for (const key in joinArgs) {
      const join = joinArgs[key];

      const nextEntity = this.getInverseTableOfRelation(parentTableMeta, key);

      // Add the new join node to parent node if there isn't a node in there already
      if (parentNode.relations[key]) {
        // Keep processing deeper joins
        return this.nodesFromJoins(
          join!,
          parentNode.relations[key],
          METADATA_STORE.getTable(nextEntity)
        );
      }

      const nextJoinArgAlias = this.getNextNodeAlias(parentNode, nextEntity);
      const nextJoinNode = { alias: nextJoinArgAlias, relations: {} };

      parentNode.relations[key] = nextJoinNode;

      // Keep processing deeper joins
      return this.nodesFromJoins(
        join!,
        nextJoinNode,
        METADATA_STORE.getTable(nextEntity)
      );
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

      const nextJoinArgAlias = this.getNextNodeAlias(parentNode, nextEntity);
      const nextNode = { alias: nextJoinArgAlias, relations: {} };

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

      const nextJoinArgAlias = this.getNextNodeAlias(parentNode, nextEntity);
      const nextNode = { alias: nextJoinArgAlias, relations: {} };

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

      const nextJoinArgAlias = this.getNextNodeAlias(parentNode, nextEntity);
      const nextNode = { alias: nextJoinArgAlias, relations: {} };

      parentNode.relations[key] = nextNode;

      return this.nodesFromOrderBys(
        orderByArgs[key] as OrderArgs<InstanceType<AnEntity>>,
        nextNode,
        nextEntityMeta
      );
    }
  }

  //
  // Uses join arguments to recursively go thru all the nested arguments and transform them to arrays of arguments for sql builder
  //
  private static processLevel<E extends AnEntity>(
    data: ArgsTransformations,
    parentJoinArg: JoinArg<E>,
    joins: Joins<InstanceType<E>>,
    wheres?: Wheres<E>,
    selects?: SelectTargetArgs<InstanceType<E>> | true,
    orders?: OrderArgs<InstanceType<E>>
  ): void {
    // Table we are joining to
    const parentTableMeta = METADATA_STORE.getTable(parentJoinArg.klass);

    //
    // Collect desired where conditions
    //
    for (const fieldName in wheres) {
      const column = parentTableMeta.columnsMap.get(fieldName);

      if (!column) {
        const relation = parentTableMeta.relations.get(fieldName);

        // If the field is a relation we go next
        // The condition will get processed in the next level, based no joins
        if (relation) {
          continue;
        }

        // If no column or relation was found we throw because this condition is bogus
        throw new Error(
          `No column found in table ${parentTableMeta.klass.name}, with fieldName ${fieldName}`
        );
      }

      data.wheres.push(
        ComparisonFactory.createFromCondition(
          parentJoinArg.alias,
          column,
          wheres[fieldName]!
        )
      );
    }

    //
    // Collect desired selects
    //

    // The entire relation is supposed to be selected
    if (selects === true) {
      data.selects.push(
        ...parentTableMeta.columns.map((column) => ({
          alias: parentJoinArg.alias,
          column,
        }))
      );
    } else {
      // Select individual desired fields
      for (const fieldName in selects) {
        if (selects[fieldName] === true) {
          const column = parentTableMeta.columnsMap.get(fieldName);

          // If there is no column, there will be a relation which will get processed in next level
          if (!column) {
            continue;
          }

          data.selects.push({ alias: parentJoinArg.alias, column });
        }
      }
    }

    //
    // Collect desired ORDER BYs
    //
    for (const fieldName in orders) {
      const order = orders[fieldName]!;

      if (typeof order !== "string" || !["ASC", "DESC"].includes(order)) {
        continue;
      }

      const column = parentTableMeta.columnsMap.get(fieldName);

      if (!column) {
        throw new Error(
          `No column found for table ${parentTableMeta.klass.name}, field name ${fieldName}`
        );
      }

      data.orderBys.push({
        alias: parentJoinArg.alias,
        column,
        // What is type inferrence? ¯\_(ツ)_/¯
        order: order as "ASC" | "DESC",
      });
    }

    //
    // Collect join and process rest of the tree
    //
    for (const key in joins) {
      const join = joins[key];

      // Get meta needed for join
      const relation = parentTableMeta.relations.get(key);
      if (!relation) {
        throw new Error(
          `No relation found on table ${parentTableMeta}, field ${key}`
        );
      }

      // Table we are joining in
      const inverseTable = relation.getOtherTable(parentTableMeta.klass);

      const nextJoinArgAlias = `${parentJoinArg.alias}_${entityNameToAlias(
        inverseTable.name
      )}`;

      const comparison = ComparisonFactory.createJoin(
        parentJoinArg.alias,
        parentTableMeta.klass,
        nextJoinArgAlias,
        relation
      );

      const nextJoinArg = JoinArgFactory.create(
        parentJoinArg.alias,
        key,
        inverseTable,
        nextJoinArgAlias,
        comparison
      );

      data.joins.push(nextJoinArg);

      // Keep processing deeper joins and wheres
      // We need to go to the next level to process wheres even if there are no more joins in the next level
      this.processLevel(
        data,
        nextJoinArg,
        join as Joins<typeof inverseTable>,
        wheres ? wheres[key] : undefined,
        // If selects is true, pass true otherwise pass selects[key]
        selects === true ? true : selects ? selects[key] : undefined,
        orders ? orders[key] : undefined
      );
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

  private static getNextNodeAlias(
    parentNode: JoinNode,
    nextKlass: AnEntity
  ): string {
    return `${parentNode.alias}_${entityNameToAlias(nextKlass.name)}`;
  }
}
