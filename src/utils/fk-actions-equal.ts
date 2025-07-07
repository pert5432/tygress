import { PostgresFKAction, ReferentialAction } from "../types/structure";
import { FKActionConverter } from "./fk-action-converter";

export const fkActionsEqual = (
  action: ReferentialAction,
  pgAction: PostgresFKAction
): boolean => {
  return FKActionConverter.toPG(action) === pgAction;
};
