import { Client } from "pg";
import {
  AnEntity,
  Joins,
  OrderArgs,
  Parametrizable,
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
import { ColumnMetadata, METADATA_STORE } from "./metadata";
import { ComparisonFactory, JoinArgFactory } from "./factories";
import { entityNameToAlias } from "./utils";
import {
  ComparisonSqlBuilder,
  ComparisonWrapper,
  NotComparisonWrapper,
  ParamBuilder,
} from "./sql-builders";
import {
  NotConditionWrapper,
  ParameterArgs,
  ParametrizedCondition,
  ParametrizedConditionWrapper,
} from "./types/where-args";

type ArgsTransformations = {
  joins: JoinArg<AnEntity>[];
  wheres: ComparisonSqlBuilder[];
  selects: SelectQueryTarget[];
  orderBys: SelectQueryOrder[];
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

    console.log(query.sql);
    console.log(query.params);

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

    if (!joins) {
      return data;
    }

    data.joins.push(
      JoinArgFactory.createRoot(entity, entityNameToAlias(entity.name))
    );

    this.processLevel(data, data.joins[0], joins, wheres, selects, orders);

    return data;
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
        this.comparisonFromCondition(
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

      const [primaryAlias, foreignAlias] =
        relation.primary === parentJoinArg.klass
          ? [parentJoinArg.alias, nextJoinArgAlias]
          : [nextJoinArgAlias, parentJoinArg.alias];

      // Column comparison for the join
      const comparison = ComparisonFactory.createColCol({
        leftAlias: foreignAlias,
        leftColumn: relation.foreignKey,
        comparator: "eq",
        rightAlias: primaryAlias,
        rightColumn: relation.primaryKey,
      });

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

  private static comparisonFromCondition = (
    alias: string,
    column: ColumnMetadata,
    condition: ParameterArgs<Parametrizable>
  ): ComparisonSqlBuilder => {
    if ((condition as Object) instanceof ParametrizedCondition) {
      // To get type safety because inference doesn't work here for some reason ¯\_(ツ)_/¯
      const parametrizedCondition =
        condition as ParametrizedCondition<Parametrizable>;

      return ComparisonFactory.createColParam({
        leftAlias: alias,
        leftColumn: column.name,
        comparator: parametrizedCondition.comparator,
        params: parametrizedCondition.parameters,
      });
    } else if (
      condition === "number" ||
      typeof condition === "string" ||
      typeof condition === "boolean"
    ) {
      return ComparisonFactory.createColParam({
        leftAlias: alias,
        leftColumn: column.name,
        comparator: "eq",
        params: [condition],
      });
    } else if ((condition as Object) instanceof ParametrizedConditionWrapper) {
      const conditionWrapper =
        condition as ParametrizedConditionWrapper<Parametrizable>;

      const comparisons = conditionWrapper.conditions.map((c) =>
        ComparisonFactory.createColParam({
          leftAlias: alias,
          leftColumn: column.name,
          comparator: c.comparator,
          params: c.parameters,
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
        this.comparisonFromCondition(
          alias,
          column,
          notConditionWrapper.condition
        )
      );
    } else {
      throw new Error(`bogus condition ${condition}`);
    }
  };
}
