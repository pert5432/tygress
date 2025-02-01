import { TableMetadata } from "../metadata";

export class JoinNode {
  entityMeta: TableMetadata;
  alias: string;

  explicitlyJoined: boolean = false;

  relations: {
    [key: string]: JoinNode;
  } = {};
}
