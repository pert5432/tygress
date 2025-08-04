// Removes keys whose values are undefined from an object
export type Defined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};
