import { AnEntity } from "../entity";
import { TargetNode } from "../query";

export type Update = {
  sql: string;

  params: any[];

  targetNode?: TargetNode<AnEntity>;
};
