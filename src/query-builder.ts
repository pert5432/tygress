import { AnEntity, Entity } from "./types";

type Extract<T> = T extends Array<infer I> | Promise<infer I> ? I : T;

export class QueryBuilder<E extends AnEntity, T extends { [key: string]: E }> {
  public a: T;

  private joins: {}[] = [];

  constructor(a: T) {
    this.a = a;
  }

  public add<IE extends AnEntity, I extends { [key: string]: IE }>(
    val: I
  ): QueryBuilder<IE, T & I> {
    this.a = { ...this.a, ...val };

    return this as any;
  }

  public join<
    K extends keyof T,
    F extends keyof InstanceType<T[K]>,
    IE extends Entity<Extract<InstanceType<T[K]>[F]>>,
    I extends { [key: string]: IE }
  >(key: K, field: F, target: I): QueryBuilder<IE, T & I> {
    this.a = { ...this.a, ...target };

    return this as any;
  }

  public has(key: keyof T) {}
}
