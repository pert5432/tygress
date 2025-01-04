import { Entity } from "..";
import { JoinNode } from ".";

export type Query<E extends Entity<unknown>> = {
  sql: string;
  joinNodes: JoinNode<E>;
};
