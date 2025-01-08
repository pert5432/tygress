export type SelectTarget<Property> = Property extends Array<infer I>
  ? SelectTargetArgs<I> | true
  : Property extends object
  ? SelectTargetArgs<Property> | true
  : true;

export type SelectTargetArgs<E> = {
  [K in keyof E]?: SelectTarget<E[K]>;
};
