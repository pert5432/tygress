export const arrayify = <T>(val: T[] | T): T[] =>
  Array.isArray(val) ? val : [val];
