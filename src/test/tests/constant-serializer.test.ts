import { describe, expect, test } from "vitest";
import { ConstantSerializer } from "../../utils";

describe("ConstantSerializer", () => {
  const e = (i: any, o: string) =>
    expect(ConstantSerializer.serialize(i)).toEqual(o);

  test("primitives", () => {
    e(123, `'123'`);
    e(123.4, `'123.4'`);
    e(null, "NULL");
    e(undefined, "NULL");
    e(true, "TRUE");
    e(false, "FALSE");
    e("asdf", `'asdf'`);
    e(`m'lady`, `'m''lady'`);
    e(new Date("2020-01-01"), `'2020-01-01T00:00:00.000Z'`);
    e(Buffer.from("asdf"), "'\\x61736466'");
  });

  test("objects", () => {
    e([], `'{}'`);
    e([123], `'{"123"}'`);
    e(["crazy", "hamburger"], `'{"crazy", "hamburger"}'`);
    e([`m'lady`], `'{"m''lady"}'`);
    e(
      [Buffer.from("asdf"), Buffer.from("meow")],
      `'{"\\\\x61736466", "\\\\x6d656f77"}'`
    );
    e([null, undefined], `'{NULL, NULL}'`);
    e(
      [new Date("2020-01-01"), new Date("2020-01-01")],
      `'{"2020-01-01T00:00:00.000Z", "2020-01-01T00:00:00.000Z"}'`
    );
    e(
      [[`m'eow`, `crazy "hamburger"`]],
      `'{{"m''eow", "crazy \\"hamburger\\""}}'`
    );
  });
});
