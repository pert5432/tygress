export type Join<Property> = Property extends Array<infer I>
  ? Join<I> | boolean
  : Property extends object
  ? Joins<Property> | true
  : never;

export type Joins<E> = {
  [K in keyof E]?: Join<E[K]>;
};
