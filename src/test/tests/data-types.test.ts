import { TEST_DB } from "../client";
import { beforeAll, describe, expect, test } from "vitest";
import { Pets } from "../entities/pets";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";

describe("data types", async () => {
  const user = TEST_DB.instantiate(Users, {
    id: "d9ca2df9-670a-4429-acbb-ac2267128032",
    username: "asdf",
  });

  const pet1 = TEST_DB.instantiate(Pets, {
    id: "4f7e1202-e34b-4711-a5a1-832c8bf9e432",
    name: "Pootis",
    userId: "d9ca2df9-670a-4429-acbb-ac2267128032",
    meta: { type: "cat", chonkStatus: "heckin chonk" },
    image: Buffer.from("Funny image"),
  });

  beforeAll(async () => {
    await TestHelper.trunc();

    await TEST_DB.insert(Users, [user]);
    await TEST_DB.insert(Pets, [pet1]);
  });

  test("simple select", async () => {
    const res = await TEST_DB.select(Pets, {
      where: { id: "4f7e1202-e34b-4711-a5a1-832c8bf9e432" },
    });

    expect(res).toStrictEqual([pet1]);
  });

  test("qb entity", async () => {
    const res = await TEST_DB.queryBuilder("p", Pets).getEntities();

    expect(res).toStrictEqual([pet1]);
  });

  test("qb raw", async () => {
    const res = await TEST_DB.queryBuilder("p", Pets).getRaw();

    expect(res).toStrictEqual([
      {
        "p.id": "4f7e1202-e34b-4711-a5a1-832c8bf9e432",
        "p.userId": "d9ca2df9-670a-4429-acbb-ac2267128032",
        "p.name": "Pootis",
        "p.meta": { type: "cat", chonkStatus: "heckin chonk" },
        "p.image": Buffer.from("Funny image"),
      },
    ]);
  });
});
