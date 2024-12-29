export type WhereCondition = "gt" | "gte" | "lt" | "lte" | "eq" | "not-eq";

export type Where<V> = {
  value: V;
  condition: WhereCondition;
};

export type Wheres<E> = {
  [K in keyof E]?: Where<E[K]>;
};
