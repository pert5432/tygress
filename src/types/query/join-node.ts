import { Entity } from "..";

export type JoinNode<T extends Entity<unknown>> = {
  klass: T;
  alias: string;
  path: string[];
  joins: {
    [K in keyof T]?: JoinNode<Entity<unknown>>;
  };
};
