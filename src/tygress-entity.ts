export const TygressEntityMarker = "@TygressEntity";

export abstract class TygressEntity {
  readonly [TygressEntityMarker]: true = true;
}
