import { dQ } from "./double-quote";
import { isNull } from "./is-null";

export abstract class ConstantSerializer {
  static serialize(val: any): string {
    if (typeof val === "function") {
      throw new Error(`Can't serialize a function as Postgres input`);
    }

    if (isNull(val)) {
      return "NULL";
    }

    // TRUE or FALSE literals should not be escaped so handling them in this function
    if (typeof val === "boolean") {
      return val ? "TRUE" : "FALSE";
    }

    // Serialize value, turn all 's into ''s and \s into \\s
    return `E'${this._serialize(val).replace(/['\\]/g, (m) => m + m)}'`;
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
      return val.toString("hex");
    }

    if (Array.isArray(val)) {
      const childValues = val.map((e) => dQ(this._serialize(e)));

      return `{${childValues.join(", ")}}`;
    }

    return JSON.stringify(val);
  }
}
