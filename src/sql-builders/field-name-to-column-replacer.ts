import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { dQ } from "../utils";
import { ParamBuilder } from "./param-builder";

type Replacement = {
  originalStart: number;
  originalEnd: number;
  replacement: string;
};

export abstract class FieldNameToColumnReplacer {
  // Takes in SQL snippet which uses actual aliases from a query and fieldNames from an entity class
  // Returns the snippet with proper quotation and fieldNames replaced by column_names
  // Ignores fieldNames which are in parentheses
  public static replaceIdentifiers(
    input: string,
    sourcesContext: { [key: string]: AnEntity }
  ): string {
    const replacements: Replacement[] = [];

    for (const word of this.wordsWithIndex(input)) {
      const replacement = this.columnIdentifierReplacement(
        word,
        sourcesContext
      );

      if (replacement) {
        replacements.push(replacement);

        continue;
      }
    }

    return this.applyReplacements(input, replacements);
  }

  public static replaceParams(
    input: string,
    paramValues: { [key: string]: any },
    paramBuilder: ParamBuilder
  ): string {
    const replacements: Replacement[] = [];

    for (const word of this.wordsWithIndex(input)) {
      const replacement = this.paramReplacement(
        word,
        paramValues,
        paramBuilder
      );

      if (replacement) {
        replacements.push(replacement);

        continue;
      }
    }

    return this.applyReplacements(input, replacements);
  }

  private static applyReplacements(
    input: string,
    replacements: Replacement[]
  ): string {
    const chunks: string[] = [];
    let lastEnd = 0;
    for (const { originalStart, originalEnd, replacement } of replacements) {
      chunks.push(input.slice(lastEnd, originalStart));
      chunks.push(replacement);

      lastEnd = originalEnd;
    }

    if (replacements.length) {
      chunks.push(
        input.slice(replacements[replacements.length - 1]!.originalEnd)
      );
    } else {
      chunks.push(input);
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

  private static paramReplacement(
    { word, index }: { word: string; index: number },
    paramValues: { [key: string]: any },
    paramBuilder: ParamBuilder
  ): Replacement | undefined {
    if (word[0] !== ":") {
      return;
    }

    const key = word.slice(1);

    const value = paramValues[key];

    if (!value) {
      return;
    }

    const paramNumbers: number[] = Array.isArray(value)
      ? value.map((v) => paramBuilder.addParam(v))
      : [paramBuilder.addParam(value)];

    return {
      originalStart: index,
      originalEnd: index + word.length,
      replacement: paramNumbers.map((e) => `$${e}`).join(", "),
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
