type Merge<TypesArray extends any[], Res = {}> = TypesArray extends [
  infer Head,
  ...infer Rem
]
  ? Merge<Rem, Res & Head>
  : Res;

type First<F, S> = F & { [Key in keyof Omit<S, keyof F>]?: never };

export type OneOf<
  TypesArray extends any[],
  Res = never,
  AllProperties = Merge<TypesArray>
> = TypesArray extends [infer Head, ...infer Rem]
  ? OneOf<Rem, Res | First<Head, AllProperties>, AllProperties>
  : Res;
