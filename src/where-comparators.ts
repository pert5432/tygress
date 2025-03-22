export const WHERE_COMPARATORS = {
  ">": (targets: string[]) => `> ${targets[0]}`,
  ">=": (targets: string[]) => `>= ${targets[0]}`,
  "<": (targets: string[]) => `< ${targets[0]}`,
  "<=": (targets: string[]) => `<= ${targets[0]}`,
  "=": (targets: string[]) => `= ${targets[0]}`,
  "<>": (targets: string[]) => `<> ${targets[0]}`,
  IN: (targets: string[]) => `IN(${targets.join(", ")})`,
} as const;
