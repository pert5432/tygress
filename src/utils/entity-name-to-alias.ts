export const entityNameToAlias = (name: string): string => {
  // Split by words assuming camelCase or PascalCase, ignore multiple capital letters after each other
  // crazyUser will become crazy, User
  // userEAN will become user, EAN
  // Also removes any underscores
  const words = name.replaceAll("_", "").split(/(?<![A-Z])(?=[A-Z])/);

  // Use first letter of each word
  // crazy, User will become cU
  return words.map((e) => e[0]).join("");
};
