import { TargetNode } from "../query";

export type Insert = {
  sql: string;

  params: any[];

  targetNode?: TargetNode;
};
