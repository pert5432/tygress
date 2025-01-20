import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { dQ } from "../utils";

export abstract class FieldNameToColumnReplacer {
  // Takes in SQL snippet which uses actual aliases from a query and fieldNames from an entity class
  // Returns the snippet with proper quotation and fieldNames replaced by column_names
  // Ignores fieldNames which are in parentheses
  public static replaceCondition<
    E extends AnEntity,
    T extends { [key: string]: E }
  >(inputSql: string, sourcesContext: T): string {
    const replacements: {
      originalStart: number;
      originalEnd: number;
      replacement: string;
    }[] = [];

    let isWithinBrackets = false;
    for (const { word, index } of this.wordsWithIndex(inputSql)) {
      let isAnyPartOfWordWithinBrackets = isWithinBrackets;

      // Read thru word, figuring out which parts are and are not within brackets
      for (let i = 0; i < word.length; i += 1) {
        const currentChar = word[i];
        if (currentChar === `'`) {
          if (!isWithinBrackets) {
            isWithinBrackets = true;
            isAnyPartOfWordWithinBrackets = true;

            continue;
          }

          // Next char is also '
          if (word[i + 1] === `'`) {
            // Skip next char since its an escaped '
            i += 1;

            continue;
          }

          isWithinBrackets = false;
        }
      }

      // If any part of this word is within brackets then it can't be a valid alias
      if (isAnyPartOfWordWithinBrackets) {
        continue;
      }

      const wordParts = word.split(".");

      // Word doesn't have exactly one dot and 2 valid parts, skipping
      if (
        wordParts.length !== 2 ||
        !wordParts[0]?.length ||
        !wordParts[1]?.length
      )
        continue;

      const [alias, fieldName] = wordParts as [string, string];

      const entity = sourcesContext[alias];

      // No entity found with this alias, skipping
      if (!entity) continue;

      const column = METADATA_STORE.getColumn(entity, fieldName);

      const target = `${dQ(alias)}.${dQ(column.name)}`;

      replacements.push({
        originalStart: index,
        originalEnd: index + word.length,
        replacement: target,
      });
    }

    const chunks: string[] = [];
    let lastEnd = 0;
    for (const { originalStart, originalEnd, replacement } of replacements) {
      chunks.push(inputSql.slice(lastEnd, originalStart));
      chunks.push(replacement);

      lastEnd = originalEnd;
    }

    if (replacements.length) {
      chunks.push(
        inputSql.slice(replacements[replacements.length - 1]!.originalEnd)
      );
    }

    return chunks.join("");
  }

  // Split a string by spaces, returning each "word" and its start index
  // Ignores multiple consequent spaces ("a   b" returns ["a", "b"])
  private static *wordsWithIndex(
    sql: string
  ): Generator<{ index: number; word: string }> {
    let currentWord = "";
    let currentWordStart = 0;

    for (let i = 0; i < sql.length; i += 1) {
      const currentChar = sql[i];

      if (currentChar === " ") {
        if (currentWord.length === 0) continue;

        yield { word: currentWord, index: currentWordStart };

        currentWord = "";
        continue;
      }

      if (currentWord === "") {
        currentWordStart = i;
      }

      currentWord += currentChar;
    }

    return;
  }
}
