export const WHERE_COMPARATORS = {
  gt: (targets: string[]) => `> ${targets[0]}`,
  gte: (targets: string[]) => `>= ${targets[0]}`,
  lt: (targets: string[]) => `< ${targets[0]}`,
  lte: (targets: string[]) => `<= ${targets[0]}`,
  eq: (targets: string[]) => `= ${targets[0]}`,
  "not-eq": (targets: string[]) => `<> ${targets[0]}`,
  in: (targets: string[]) => `IN(${targets.join(", ")})`,
} as const;
