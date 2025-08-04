import { IsPrimitive } from ".";
import { AnEntity } from "./entity";

export type EntityColumns<E extends InstanceType<AnEntity>> = {
  [K in keyof E as IsPrimitive<E[K]> extends true ? K : never]: E[K];
};
