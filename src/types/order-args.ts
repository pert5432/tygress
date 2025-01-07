import { AnEntity, Parametrizable } from "./";

export type Order<Property> = Property extends Array<infer I>
  ? OrderArgs<I>
  : Property extends AnEntity
  ? OrderArgs<Property>
  : Property extends Parametrizable
  ? "ASC" | "DESC"
  : never;

export type OrderArgs<E extends InstanceType<AnEntity>> = {
  [K in keyof E]?: Order<E[K]>;
};
