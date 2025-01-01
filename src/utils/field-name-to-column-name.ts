export const fieldNameToColumName = (fieldName: string): string => {
  // Split by words assuming camel case, ignore multiple capital letters after each other
  // crazyUser will become crazy, User
  // userEAN will become user, EAN
  // Also removes any underscores
  const words = fieldName.replaceAll("_", "").split(/(?<![A-Z])(?=[A-Z])/);

  // Lowercase
  return words.map((e) => e.toLocaleLowerCase()).join("_");
};
