export const isNull = <T>(val: T | null | undefined): val is null | undefined =>
  val === undefined || val === null;
