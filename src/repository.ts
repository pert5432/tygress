import { Client } from "pg";
import { AnEntity, Entity, Joins, SelectArgs, SelectQueryArgs } from "./types";
import { SelectSqlBuilder } from "./sql-builders/select-sql-builder";
import { QueryRunner } from "./query-runner";
import { JoinArg } from "./types/query/join-arg";
import { METADATA_STORE } from "./metadata";
import { ComparisonFactory, JoinArgFactory } from "./factories";
import { entityNameToAlias } from "./utils";

export abstract class Repository {
  public static async select<T extends AnEntity>(
    client: Client,
    entity: T,
    args: SelectArgs<InstanceType<T>>
  ): Promise<InstanceType<T>[]> {
    const queryArgs: SelectQueryArgs<T> = {
      ...args,
      joins: this.transformJoins(entity, args.joins),
    };

    const query = new SelectSqlBuilder(queryArgs).buildSelect();

    console.log(query.sql);
    console.log(query.params);

    return await new QueryRunner(client, query).run();
  }

  private static transformJoins<T extends AnEntity>(
    entity: T,
    joins?: Joins<InstanceType<T>>
  ): JoinArg<AnEntity>[] {
    if (!joins) {
      return [];
    }

    const joinArgs: JoinArg<AnEntity>[] = [
      JoinArgFactory.createRoot(entity, entityNameToAlias(entity.name)),
    ];

    // TODO: clean up naming in this function
    const joinTable = <E extends Entity<unknown>>(
      parentJoinArg: JoinArg<E>,
      joins: Joins<InstanceType<E>>
    ): void => {
      // Table we are joining to
      const parentTableMeta = METADATA_STORE.getTable(parentJoinArg.klass);

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

        joinArgs.push(nextJoinArg);

        // Keep processing deeper joins if argument is an object
        if (join instanceof Object) {
          joinTable(nextJoinArg, join as Joins<typeof inverseTable>);
        }
      }
    };

    joinTable(joinArgs[0], joins);

    return joinArgs;
  }
}
