import { AnEntity } from "../entity";
import { TargetNode } from "../query";

export type Insert = {
  sql: string;

  params: any[];

  targetNode?: TargetNode<AnEntity>;
};
