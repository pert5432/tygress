import {
  IndexColumnMetadata,
  IndexMetadata,
  METADATA_STORE,
} from "../metadata";
import { AnEntity, ObjectKey } from "../types";
import { IndexMetadataArgs } from "../types/create-args";
import { IndexColumnArgs } from "../types/decorators";

export abstract class IndexMetadataFactory {
  static create(args: IndexMetadataArgs): IndexMetadata {
    const e = new IndexMetadata();

    e.table = METADATA_STORE.getTable(args.klass);
    e.name = args.name;

    e.keyColumns = args.columns.map((c) => this.createKeyColumn(args.klass, c));

    e.includeColumns = (args.includeColumns ?? []).map((c) =>
      METADATA_STORE.getColumn(args.klass, c)
    );

    e.method = args.method ?? "btree";
    e.unique = args.unique ?? false;
    e.nullsDistinct = args.nullsDistinct;
    e.where = args.where;

    return e;
  }

  private static createKeyColumn(
    klass: AnEntity,
    args: IndexColumnArgs<ObjectKey>
  ): IndexColumnMetadata {
    if (!args.expression && !args.field) {
      throw new Error(`Index column has to have a field or an expression`);
    }

    const e = new IndexColumnMetadata();

    e.column = args.field
      ? METADATA_STORE.getColumn(klass, args.field.toString())
      : undefined;
    e.expression = args.expression;

    e.order = args.order;
    e.nulls = args.nulls;

    return e;
  }
}
