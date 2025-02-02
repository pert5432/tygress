import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { dQ } from "../utils";

type Replacement = {
  originalStart: number;
  originalEnd: number;
  replacement: string;
};

export abstract class FieldNameToColumnReplacer {
  // Takes in SQL snippet which uses actual aliases from a query and fieldNames from an entity class
  // Returns the snippet with proper quotation and fieldNames replaced by column_names
  // Ignores fieldNames which are in parentheses
  public static replaceCondition(
    inputSql: string,
    sourcesContext: { [key: string]: AnEntity }
  ): string {
    const replacements: Replacement[] = [];

    for (const word of this.wordsWithIndex(inputSql)) {
      const identifierReplacement = this.columnIdentifierReplacement(
        word,
        sourcesContext
      );

      if (identifierReplacement) {
        replacements.push(identifierReplacement);

        continue;
      }
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
    } else {
      chunks.push(inputSql);
    }

    return chunks.join("");
  }

  private static columnIdentifierReplacement(
    { word, index }: { word: string; index: number },
    sourcesContext: { [key: string]: AnEntity }
  ): Replacement | undefined {
    const wordParts = word.split(".");

    // Word doesn't have exactly one dot and 2 valid parts, skipping
    if (
      wordParts.length !== 2 ||
      !wordParts[0]?.length ||
      !wordParts[1]?.length
    )
      return;

    const [alias, fieldName] = wordParts as [string, string];

    const entity = sourcesContext[alias];

    // No entity found with this alias, skipping
    if (!entity) return;

    const column = METADATA_STORE.getColumn(entity, fieldName);

    const target = `${dQ(alias)}.${dQ(column.name)}`;

    return {
      originalStart: index,
      originalEnd: index + word.length,
      replacement: target,
    };
  }

  // Split a string by spaces, returning each "word" and its start index
  // Ignores multiple consequent spaces ("a   b" returns ["a", "b"])
  // Doesn't return words that are within single quotes
  private static *wordsWithIndex(
    sql: string
  ): Generator<{ index: number; word: string }> {
    let currentWord = "";
    let currentWordStart = 0;

    let isWithinQuotes = false;

    for (let i = 0; i < sql.length; i += 1) {
      const currentChar = sql[i];

      if (currentChar === `'`) {
        if (!isWithinQuotes) {
          isWithinQuotes = true;

          continue;
        }

        // Next char is also '
        if (sql[i + 1] === `'`) {
          // Skip next char since its an escaped '
          i += 1;

          continue;
        }

        isWithinQuotes = false;

        continue;
      }

      if (currentChar === " ") {
        if (currentWord.length === 0) continue;

        if (!isWithinQuotes) {
          yield { word: currentWord, index: currentWordStart };
        }

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
