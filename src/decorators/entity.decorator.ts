import { METADATA_STORE } from "../metadata-store";

export const EntityDecorator = (name: string) => {
  return function (value: Function, context: ClassDecoratorContext) {
    METADATA_STORE.insert({ fn: value, name, className: context.name });
  };
};
