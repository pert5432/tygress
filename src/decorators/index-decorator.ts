import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";

type ColumnArg<F> = {
  field: F;
  order?: "ASC" | "DESC";
  nulls?: "FIRST" | "LAST";
};

export const Index = <
  K extends Object & { [key: string]: any },
  F extends keyof K
>(
  name: string,
  args: {
    columns: F[] | ColumnArg<F>[];
    includeColumns?: F[];
    nullsDistinct?: boolean;
  }
) => {
  return function (target: K) {
    const { columns, includeColumns, nullsDistinct } = args;

    if (!columns.length) {
      throw new Error("No columns supplied to index definition");
    }

    METADATA_STORE.addIndexArgs({
      klass: target.constructor as AnEntity,
      name,

      columns:
        typeof columns[0] === "object"
          ? (columns as ColumnArg<F>[]).map((e: ColumnArg<F>) => ({
              fieldName: e.field.toString(),
              ...e,
            }))
          : (columns as F[]).map((e) => ({ fieldName: e.toString() })),

      includeColumns: (includeColumns ?? []).map((e) => e.toString()),

      nullsDistinct,
    });
  };
};
