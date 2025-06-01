import { ColumnDefault } from "../types/structure";

export const parsePgColumnDefault = (
  pgColumnDefault: string
): ColumnDefault => {
  // Is a constant value
  // Returned in `'value'::type` format
  if (pgColumnDefault[0] === `'`) {
    const lastQuote = pgColumnDefault.lastIndexOf(`'`);

    return { type: "value", value: pgColumnDefault.slice(1, lastQuote) };
  }

  return { type: "expression", value: pgColumnDefault };
};
