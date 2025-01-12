import { Entity } from "..";
import { TargetNode } from ".";

export type Query<E extends Entity<unknown>> = {
  sql: string;
  params: any[];
  joinNodes: TargetNode<E>;
};
