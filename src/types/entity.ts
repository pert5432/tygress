export type Entity<T> = { new (): T } & { [key: string]: any };
