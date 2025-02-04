import { AnEntity } from "..";
import { TargetNode } from ".";

export type Query = {
  sql: string;
  params: any[];
  joinNodes: TargetNode<AnEntity>;
};
