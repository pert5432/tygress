import { AnEntity } from "./entity";

export type QueryBuilderGenerics = {
  RootEntity: AnEntity;
  JoinedEntities: Record<string, SelectSource>;
  CTEs: Record<string, SelectSource>;
  SelectedEntities: Record<string, SelectSource>;
  ExplicitSelects: Record<string, any>;
};

export type Update<
  Input extends QueryBuilderGenerics,
  UpdateKey extends keyof Input,
  UpdateValue extends Input[UpdateKey]
> = Omit<Input, UpdateKey> & Record<UpdateKey, UpdateValue>;

export type SelectSource = AnEntity | Record<string, any>;

export type SelectSourceField<
  E extends SelectSource,
  K extends keyof E
> = E extends AnEntity ? InstanceType<E>[K] : E[K];

export type SelectSourceKeys<S extends SelectSource> = S extends AnEntity
  ? keyof InstanceType<S>
  : keyof S;

export type Stringify<T> = T extends string ? T : never;
