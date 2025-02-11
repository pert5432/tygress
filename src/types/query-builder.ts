import { AnEntity } from "./entity";

export type QueryBuilderGenerics = {
  RootEntity: AnEntity;
  JoinedEntities: Record<string, AnEntity>;
  SelectedEntities: Record<string, AnEntity>;
  ExplicitSelects: Record<string, any>;
};

export type Update<
  Input extends QueryBuilderGenerics,
  UpdateKey extends keyof Input,
  UpdateValue extends Input[UpdateKey]
> = Omit<Input, UpdateKey> & Record<UpdateKey, UpdateValue>;
