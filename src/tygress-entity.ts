export const TygressEntityMarker = Symbol.for("@TygressEntity");

export abstract class TygressEntity {
  readonly [TygressEntityMarker]: true = true;
}
