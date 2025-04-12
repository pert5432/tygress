// Makes all functions of a class optional and leaves other fields as is
// Used for arguments for class creation where you want to specify fields of the instance directly
export type ClassArg<T> = {
  [K in keyof T as T[K] extends Function ? K : never]?: T[K];
} & {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
