import { TEST_DB } from "../client";
import { beforeAll, describe, expect, test } from "vitest";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";
import { Pets } from "../entities/pets";
import { Gt, In, Lte } from "../../api";

describe("select", async () => {
  const user1 = TEST_DB.instantiate(Users, {
    id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    firstName: "John",
    lastName: "Doe",
    username: "JohnDoe",
    birthdate: new Date("2020-01-01"),
  });

  const pet1 = TEST_DB.instantiate(Pets, {
    id: "f894a951-c092-44f4-ac82-ce586f872ff9",
    userId: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    name: "Pootis",
  });

  const pet2 = TEST_DB.instantiate(Pets, {
    id: "5eedfce2-c677-4153-b92e-3a2dd04392c9",
    userId: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    name: "Moofis",
  });

  const user2 = TEST_DB.instantiate(Users, {
    id: "406b635b-508e-4824-855d-fb71d77bcdac",
    firstName: "Kyriakos",
    lastName: "Grizzly",
    username: "AAAAAAAAAAA",
    birthdate: null,
  });

  beforeAll(async () => {
    await TestHelper.trunc();

    await TEST_DB.insert(Users, [user1, user2]);
    await TEST_DB.insert(Pets, [pet1, pet2]);
  });

  test("basic", async () => {
    const res = await TEST_DB.select(Users, {});

    expect(res).toStrictEqual([user1, user2]);
  });

  test("order", async () => {
    const res = await TEST_DB.select(Users, {
      order: {
        username: "ASC",
      },
    });

    expect(res).toStrictEqual([user2, user1]);
  });

  test("join", async () => {
    const res = await TEST_DB.select(Users, {
      joins: {
        pets: true,
      },
      order: {
        username: "ASC",
        pets: {
          name: "ASC",
        },
      },
    });

    expect(res[0]!.pets).toStrictEqual([]);
    expect(res[1]!.pets).toStrictEqual([pet2, pet1]);
  });

  describe("select", async () => {
    test("nested without join", async () => {
      const res = await TEST_DB.select(Users, {
        select: {
          pets: true,
        },
        order: {
          username: "ASC",
          pets: {
            name: "ASC",
          },
        },
      });

      expect(res[0]!.pets).toStrictEqual([]);
      expect(res[1]!.pets).toStrictEqual([pet2, pet1]);

      expect(res.map((e) => e.id)).toStrictEqual([undefined, undefined]);
    });

    test("specific fields", async () => {
      const res = await TEST_DB.select(Users, {
        select: {
          username: true,
          birthdate: true,
        },
        order: {
          username: "ASC",
        },
      });

      TestHelper.validateObject(res[0]!, {
        username: user2.username,
        birthdate: user2.birthdate,
      });
      TestHelper.validateObject(res[1]!, {
        username: user1.username,
        birthdate: user1.birthdate,
      });

      TestHelper.validateObject(
        {
          username: user2.username,
          birthdate: user2.birthdate,
        },
        res[0]!
      );
      TestHelper.validateObject(
        {
          username: user1.username,
          birthdate: user1.birthdate,
        },
        res[1]!
      );
    });
  });

  describe("where", async () => {
    test("simple value", async () => {
      const res = await TEST_DB.select(Users, { where: { id: user1.id } });

      expect(res).toStrictEqual([user1]);
    });

    test("gt", async () => {
      const res = await TEST_DB.select(Users, {
        where: { username: Gt("A") },
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([user2, user1]);
    });

    test("in", async () => {
      const res = await TEST_DB.select(Users, {
        where: { id: In([user1.id, user2.id]) },
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([user2, user1]);
    });
  });

  describe("limit", async () => {
    test("1", async () => {
      const res = await TEST_DB.select(Users, {
        limit: 1,
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([user2]);
    });

    test("20", async () => {
      const res = await TEST_DB.select(Users, {
        limit: 20,
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([user2, user1]);
    });
  });

  describe("offset", async () => {
    test("1", async () => {
      const res = await TEST_DB.select(Users, {
        offset: 1,
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([user1]);
    });

    test("20", async () => {
      const res = await TEST_DB.select(Users, {
        offset: 20,
        order: { username: "ASC" },
      });

      expect(res).toStrictEqual([]);
    });
  });
});
