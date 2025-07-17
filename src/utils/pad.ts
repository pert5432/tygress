export const SPACES_PER_INDENT_LEVEL = 2;

/*
 * Pads each line of input to specified level of indentation
 */
export const pad = (level: number, payload: string): string => {
  return payload
    .split("\n")
    .map((line) => `${" ".repeat(level * 2)}${line}`)
    .join("\n");
};
