import {
  IndexColumnMetadata,
  IndexMetadata,
  METADATA_STORE,
} from "../metadata";
import { AnEntity } from "../types";
import { IndexMetadataArgs } from "../types/create-args";

export abstract class IndexMetadataFactory {
  static create(args: IndexMetadataArgs): IndexMetadata {
    const e = new IndexMetadata();

    e.table = METADATA_STORE.getTable(args.klass);
    e.name = args.name;

    e.keyColumns = args.columns.map((c) => this.createKeyColumn(args.klass, c));

    e.includeColumns = (args.includeColumns ?? []).map((c) =>
      METADATA_STORE.getColumn(args.klass, c)
    );

    e.nullsDistinct = args.nullsDistinct;

    return e;
  }

  private static createKeyColumn(
    klass: AnEntity,
    args: {
      fieldName: string;
      order?: "ASC" | "DESC";
      nulls?: "FIRST" | "LAST";
    }
  ): IndexColumnMetadata {
    const e = new IndexColumnMetadata();

    e.column = METADATA_STORE.getColumn(klass, args.fieldName);
    e.order = args.order;
    e.nulls = args.nulls;

    return e;
  }
}
