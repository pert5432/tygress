export const SPACES_PER_INDENT_LEVEL = 2;

export const pad = (level: number, payload: string): string => {
  return `${" ".repeat(level * 2)}${payload}`;
};
