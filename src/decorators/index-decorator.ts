import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { IndexColumnArgs, IndexDecoratorArgs } from "../types/decorators";

/**
 * Defines an index on a table
 *
 * https://www.postgresql.org/docs/current/sql-createindex.html
 *
 * @param name name of the index
 */
export const Index = <K extends AnEntity, F extends keyof InstanceType<K>>(
  name: string,
  args: IndexDecoratorArgs<K, F>
) => {
  return function (target: K) {
    const { columns, includeColumns, unique, nullsDistinct, method } = args;

    if (!columns.length) {
      throw new Error("No columns supplied to index definition");
    }

    METADATA_STORE.addIndexArgs({
      klass: target as AnEntity,
      name,

      columns:
        typeof columns[0] === "object"
          ? (columns as IndexColumnArgs<F>[])
          : (columns as F[]).map((e) => ({ field: e.toString() })),

      includeColumns: (includeColumns ?? []).map((e) => e.toString()),
      unique,
      nullsDistinct,
      method,
    });
  };
};
