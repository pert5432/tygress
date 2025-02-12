import { METADATA_STORE } from "../metadata";
import { AnEntity } from "../types";
import { NamedParams } from "../types/named-params";
import { QueryBuilderGenerics } from "../types/query-builder";
import { dQ } from "../utils";
import { ParamBuilder } from "./param-builder";

type Replacement = {
  originalStart: number;
  originalEnd: number;
  replacement: string;
};

export abstract class PseudoSQLReplacer {
  // Takes in SQL snippet which uses actual aliases from a query and fieldNames from an entity class
  // Returns the snippet with proper quotation and fieldNames replaced by column_names
  // Ignores any input in parentheses
  public static replaceIdentifiers(
    input: string,
    sourcesContext: QueryBuilderGenerics["JoinedEntities"]
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

  // Takes in SQL snippet which uses :param notation for named params + object with values for these params
  // Returns the snippet with :params replaced with numeric params
  // Ignores any input in parentheses
  public static replaceParams(
    input: string,
    paramValues: NamedParams,
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
    sourcesContext: QueryBuilderGenerics["JoinedEntities"]
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
    if (!entity || typeof entity === "object") return;

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
    paramValues: NamedParams,
    paramBuilder: ParamBuilder
  ): Replacement | undefined {
    if (word[0] !== ":") {
      return;
    }

    const key = word.slice(1);

    const value = paramValues[key];

    if (value === undefined) {
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

  // Fish out possible identifiers from an input, return each of them with its start index
  // Ignores multiple consequent characters that can't appear in identifiers ("a   b" returns ["a", "b"])
  // Doesn't return words that are within single quotes
  private static *wordsWithIndex(
    sql: string
  ): Generator<{ index: number; word: string }> {
    // All characters that we allow param identifiers or column identifiers to be made from
    const desiredOutputRegex = /([A-Za-z_.:])/;

    let currentWord = "";
    let currentWordStart = 0;

    let isWithinQuotes = false;

    for (let i = 0; i < sql.length; i += 1) {
      const currentChar = sql[i]!;

      if (currentWord === "") {
        currentWordStart = i;
      }

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

      if (!currentChar.match(desiredOutputRegex)?.length) {
        if (currentWord.length === 0) continue;

        if (!isWithinQuotes) {
          yield { word: currentWord, index: currentWordStart };
        }

        currentWord = "";
        continue;
      }

      currentWord += currentChar;

      // If the current word ends with ::
      // Yield the word excluding ::
      // This is done so that casts are stripped from identifiers
      if (currentWord.slice(-2) === "::" && !isWithinQuotes) {
        yield { word: currentWord.slice(0, -2), index: currentWordStart };
        currentWord = "";
      }
    }

    if (currentWord.length && !isWithinQuotes) {
      yield { word: currentWord, index: currentWordStart };
    }

    return;
  }
}
