export type Entity<T> = { new (): T } & { [key: string]: any };

// Simply because its more convenient than typing Entity<unknown> ;)
export type AnEntity = Entity<any>;
