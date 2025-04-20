import { AnEntity } from "../entity";
import { TargetNode } from "../query";

export type Delete = {
  sql: string;

  params: any[];

  targetNode?: TargetNode<AnEntity>;
};
