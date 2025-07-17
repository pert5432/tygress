export type Entity<T> = { new (): T } & { [key: string]: any };

// Simply because its more convenient than typing Entity<any> ;)
export type AnEntity = Entity<any>;
