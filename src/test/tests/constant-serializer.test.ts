import { describe, expect, test } from "vitest";
import { ConstantSerializer } from "../../utils";

describe("ConstantSerializer", () => {
  const e = (i: any, o: string) =>
    expect(ConstantSerializer.serialize(i)).toEqual(o);

  test("primitives", () => {
    e(123, `E'123'`);
    e(123.4, `E'123.4'`);
    e(true, "TRUE");
    e(false, "FALSE");
    e(new Date("2020-01-01"), `E'2020-01-01T00:00:00.000Z'`);
    e(Buffer.from("asdf"), "E'61736466'");
  });

  test("objects", () => {
    e([], `E'{}'`);
    e([123], `E'{"123"}'`);
  });
});
