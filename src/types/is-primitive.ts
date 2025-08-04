import { TygressEntityMarker } from "../tygress-entity";
import { Parametrizable } from "./parametrizable";

export type IsPrimitive<T> = T extends Parametrizable
  ? true
  : T extends { [TygressEntityMarker]: true }
  ? false
  : T extends Function
  ? false
  : T extends { new (...args: any[]): any }
  ? false
  : T extends Array<infer I>
  ? IsPrimitive<I>
  : true;
