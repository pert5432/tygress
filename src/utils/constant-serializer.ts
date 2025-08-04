import { dQ } from "./double-quote";
import { isNull } from "./is-null";

// Serializes a value int Postgres input
export abstract class ConstantSerializer {
  // These values should not be put in "s or 's
  private static UNESCAPEABLE_VALUES: string[] = ["NULL", "TRUE", "FALSE"];

  static serialize(val: any): string {
    const serialized = this._serialize(val);

    if (this.UNESCAPEABLE_VALUES.includes(serialized)) {
      return serialized;
    }

    // Serialize value, turn all 's into ''s
    return `'${this._serialize(val).replace(/[']/g, (m) => m + m)}'`;
  }

  private static _serialize(val: any): string {
    if (typeof val === "function") {
      throw new Error(`Can't serialize a function as Postgres input`);
    }

    if (isNull(val)) {
      return "NULL";
    }

    switch (typeof val) {
      case "boolean":
        return val ? "TRUE" : "FALSE";
      case "object":
        return this.serializeObject(val);
      default:
        return val.toString();
    }
  }

  private static serializeObject(val: object): string {
    if (val instanceof Date) {
      return val.toISOString();
    }

    if (val instanceof Buffer) {
      return "\\x" + val.toString("hex");
    }

    if (Array.isArray(val)) {
      const childValues = val.map((e) =>
        this.escapeArrayElement(this._serialize(e))
      );

      return `{${childValues.join(", ")}}`;
    }

    return JSON.stringify(val);
  }

  // By default array elements should be enclosed in "s but there are some exceptions
  private static escapeArrayElement(e: string): string {
    if (this.UNESCAPEABLE_VALUES.includes(e)) {
      return e;
    }

    // e is an array, we don't want to quote it
    if (e[0] === "{") {
      return e;
    }

    // Replace all \s with \\ and "s with \" and double quote
    return dQ(e.replace(/[\\"]/g, (m) => `\\${m}`));
  }
}
