import { TableMetadata } from "../../metadata";
import { JoinNode } from "../../repository/index";
import { entityNameToAlias } from "../../utils";

export abstract class JoinNodeFactory {
  static createRoot(entityMeta: TableMetadata): JoinNode {
    const e = new JoinNode();

    e.entityMeta = entityMeta;
    e.alias = entityNameToAlias(entityMeta.klass.name);

    e.explicitlyJoined = true;

    return e;
  }

  static createFromJoin(
    entityMeta: TableMetadata,
    parentAlias: string
  ): JoinNode {
    const e = new JoinNode();

    e.entityMeta = entityMeta;
    e.alias = `${parentAlias}_${entityNameToAlias(entityMeta.klass.name)}`;

    e.explicitlyJoined = true;

    return e;
  }

  static create(entityMeta: TableMetadata, parentAlias: string): JoinNode {
    const e = new JoinNode();

    e.entityMeta = entityMeta;
    e.alias = `${parentAlias}_${entityNameToAlias(entityMeta.klass.name)}`;

    return e;
  }
}
