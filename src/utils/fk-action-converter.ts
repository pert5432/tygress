import { PostgresFKAction, ReferentialAction } from "../types/structure";

const toPG: { [key in ReferentialAction]: PostgresFKAction } = {
  "NO ACTION": "a",
  RESTRICT: "r",
  CASCADE: "c",
  "SET NULL": "n",
  "SET DEFAULT": "d",
};

const toTygress: { [key in PostgresFKAction]: ReferentialAction } = {
  a: "NO ACTION",
  r: "RESTRICT",
  c: "CASCADE",
  n: "SET NULL",
  d: "SET DEFAULT",
};

export const FKActionConverter = {
  toPG: (action: ReferentialAction): PostgresFKAction => toPG[action],
  toTygress: (action: PostgresFKAction) => toTygress[action],
};
