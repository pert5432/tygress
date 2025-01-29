import { AnEntity, Parametrizable } from "./";

export type Order<Property> = Property extends Parametrizable
  ? "ASC" | "DESC"
  : Property extends Array<infer I>
  ? OrderArgs<I>
  : Property extends AnEntity | InstanceType<AnEntity>
  ? OrderArgs<Property>
  : never;

export type OrderArgs<E extends InstanceType<AnEntity>> = {
  [K in keyof E]?: Order<E[K]>;
};
