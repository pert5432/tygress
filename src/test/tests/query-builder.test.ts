import { TEST_DB } from "../client";
import { beforeAll, describe, expect, test } from "vitest";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";
import { Pets } from "../entities/pets";
import { In, IsNotNull, IsNull, Lte } from "../../api";

describe("QueryBuilder", async () => {
  const user1 = {
    id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    firstName: "John",
    lastName: "Doe",
    username: "JohnDoe",
    birthdate: new Date("2020-01-01"),
  };

  const pet1 = {
    id: "bec37141-f990-4960-a03c-d78b43bc4c8e",
    userId: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    name: "Pootis",
  };

  const pet2 = {
    id: "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
    userId: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    name: "Moofis",
  };

  const user2 = {
    id: "406b635b-508e-4824-855d-fb71d77bcdac",
    firstName: "Kyriakos",
    lastName: "Grizzly",
    username: "AAAAAAAAAAA",
  };

  beforeAll(async () => {
    await TestHelper.trunc();

    await TEST_DB.insert(Users, [user1, user2]);
    await TEST_DB.insert(Pets, [pet1, pet2]);
  });

  test("basic select", async () => {
    const res = await TEST_DB.queryBuilder("u", Users).getEntities();

    expect(res).toHaveLength(2);

    TestHelper.validateObject(res[0]!, user1);
    TestHelper.validateObject(res[1]!, user2);
  });

  describe("joins", async () => {
    test("inner and map", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .innerJoinAndMap("p", Pets, "u", "pets")
        .getEntities();

      expect(res).toHaveLength(1);
      expect(res[0]!.pets).toHaveLength(2);
    });

    test("inner and select", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .innerJoinAndSelect("p", Pets, "u", "pets")
        .getEntities();

      expect(res).toHaveLength(1);
      expect(res[0]!.pets).toBe(undefined);
    });

    test("inner", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .innerJoin("p", Pets, "u", "pets")
        .getEntities();

      expect(res).toHaveLength(1);
      expect(res[0]!.pets).toBeUndefined();
    });

    test("left and map", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .leftJoinAndMap("p", Pets, "u", "pets")
        .orderBy("u", "username", "ASC")
        .getEntities();

      expect(res).toHaveLength(2);

      expect(res[0]!.pets).toHaveLength(0);
      expect(res[1]!.pets).toHaveLength(2);
    });

    test("left and select", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .leftJoinAndSelect("p", Pets, "u", "pets")
        .orderBy("u", "username", "ASC")
        .getEntities();

      expect(res).toHaveLength(2);

      expect(res[0]!.pets).toBeUndefined();
      expect(res[1]!.pets).toBeUndefined();
    });

    test("left", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .leftJoin("p", Pets, "u", "pets")
        .orderBy("u", "username", "ASC")
        .getEntities();

      expect(res).toHaveLength(2);

      expect(res[0]!.pets).toBeUndefined();
      expect(res[1]!.pets).toBeUndefined();
    });

    test("right", async () => {
      const res = await TEST_DB.queryBuilder("p", Pets)
        .rightJoin("u", Users, "p", "user")
        .orderBy("u", "id")
        .orderBy("p", "id")
        .getRaw();

      expect(res).toStrictEqual([
        { "p.id": null, "p.userId": null, "p.name": null },
        {
          "p.id": "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
          "p.userId": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "p.name": "Moofis",
        },
        {
          "p.id": "bec37141-f990-4960-a03c-d78b43bc4c8e",
          "p.userId": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "p.name": "Pootis",
        },
      ]);
    });

    // This currently passes but shouldn't
    // Need to move selecting fields await from SelectSqlBuilder to fix
    // test("right and select", async () => {
    //   const res = await TEST_DB.queryBuilder("p", Pets)
    //     .rightJoinAndSelect("u", Users, "p", "user")
    //     .orderBy("u", "id")
    //     .orderBy("p", "id")
    //     .getRaw();

    //   console.log(res);

    //   expect(res).toStrictEqual([
    //     { "p.id": null, "p.userId": null, "p.name": null },
    //     {
    //       "p.id": "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
    //       "p.userId": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    //       "p.name": "Moofis",
    //     },
    //     {
    //       "p.id": "bec37141-f990-4960-a03c-d78b43bc4c8e",
    //       "p.userId": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    //       "p.name": "Pootis",
    //     },
    //   ]);
    // });

    test("full", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .fullJoin("p", Pets, (j) => j.relation("u", "pets"))
        .select("u", "id", "user_id")
        .select("p", "id", "pet_id")
        .orderBy("p", "id", "ASC")
        .orderBy("u", "id", "ASC")
        .getRaw();

      expect(res).toStrictEqual([
        {
          user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          pet_id: "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
        },
        {
          user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          pet_id: "bec37141-f990-4960-a03c-d78b43bc4c8e",
        },
        { user_id: "406b635b-508e-4824-855d-fb71d77bcdac", pet_id: null },
      ]);
    });

    test("cross", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .crossJoin("p", Pets)
        .select("u", "id", "user_id")
        .select("p", "id", "pet_id")
        .orderBy("p", "id", "ASC")
        .orderBy("u", "id", "ASC")
        .getRaw();

      expect(res).toStrictEqual([
        {
          user_id: "406b635b-508e-4824-855d-fb71d77bcdac",
          pet_id: "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
        },
        {
          user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          pet_id: "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
        },
        {
          user_id: "406b635b-508e-4824-855d-fb71d77bcdac",
          pet_id: "bec37141-f990-4960-a03c-d78b43bc4c8e",
        },
        {
          user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          pet_id: "bec37141-f990-4960-a03c-d78b43bc4c8e",
        },
      ]);
    });

    test("cross and select", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .crossJoinAndSelect("p", Pets)
        .orderBy("p", "id", "ASC")
        .orderBy("u", "id", "ASC")
        .getRaw();

      expect(res).toStrictEqual([
        {
          "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
          "u.firstName": "Kyriakos",
          "u.lastName": "Grizzly",
          "u.username": "AAAAAAAAAAA",
          "u.birthdate": null,
        },
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "u.firstName": "John",
          "u.lastName": "Doe",
          "u.username": "JohnDoe",
          "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
        },
        {
          "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
          "u.firstName": "Kyriakos",
          "u.lastName": "Grizzly",
          "u.username": "AAAAAAAAAAA",
          "u.birthdate": null,
        },
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "u.firstName": "John",
          "u.lastName": "Doe",
          "u.username": "JohnDoe",
          "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
        },
      ]);
    });

    test("explicit", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .innerJoin("p", Pets, (j) => j.on("p", "userId", "=", "u", "id"))
        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);
    });

    test("sql", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .innerJoin("p", Pets, (j) => j.sql("p.userId = u.id"))
        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);
    });
  });

  test("explicit selects", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .leftJoin("p", Pets, (j) => j.relation("u", "pets"))

      .select("p", "name", "pet_name")
      .select("u", "id", "user_id")
      .select("u", "birthdate", "birthdate")

      .orderBy("u", "username", "ASC")
      .orderBy("p", "name")

      .getRaw();

    expect(res).toHaveLength(3);

    expect(res).toEqual([
      {
        pet_name: null,
        user_id: "406b635b-508e-4824-855d-fb71d77bcdac",
        birthdate: null,
      },
      {
        pet_name: "Moofis",
        user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
        birthdate: new Date("2020-01-01T00:00:00.000Z"),
      },
      {
        pet_name: "Pootis",
        user_id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
        birthdate: new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);
  });

  describe("wheres", async () => {
    test("simple", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("u", "firstName", ">", "u", "lastName")
        .getEntities();

      expect(res).toHaveLength(2);

      TestHelper.validateObject(res[0]!, user1);
      TestHelper.validateObject(res[1]!, user2);

      const res2 = await TEST_DB.queryBuilder("u", Users)
        .where("u", "firstName", "<", "u", "lastName")
        .getEntities();

      expect(res2).toHaveLength(0);
    });

    test("condition", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("u", "username", In(["JohnDoe", "JohnJoe", "DoeJones"]))
        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);

      const res2 = await TEST_DB.queryBuilder("u", Users)
        .where("u", "username", Lte("B"))
        .getEntities();

      expect(res2).toHaveLength(1);

      TestHelper.validateObject(res2[0]!, user2);
    });

    test("isNull", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("u", "birthdate", IsNull())
        .getEntities();

      TestHelper.validateObject(res[0]!, user2);
    });

    test("isNotNull", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("u", "birthdate", IsNotNull())
        .getEntities();

      TestHelper.validateObject(res[0]!, user1);
    });

    test("sql", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("LOWER(u.username) = :username", { username: "johndoe" })
        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);
    });

    test("subquery", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .where("u", "username", ">", (qb) =>
          qb
            .from("a", Users)
            .select("a", "username")
            .orderBy("a", "username")
            .limit(1)
        )
        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);
    });
  });

  test("select sql", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .selectSQL("LOWER(u.username)", "username")
      .orderBy("u", "username")
      .getRaw();

    expect(res).toEqual([
      { username: user2.username.toLowerCase() },
      { username: user1.username.toLowerCase() },
    ]);
  });

  test("select *", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .select("u", "*")
      .orderBy("u", "username")
      .getRaw();

    expect(res).toEqual([
      {
        "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
        "u.firstName": "Kyriakos",
        "u.lastName": "Grizzly",
        "u.username": "AAAAAAAAAAA",
        "u.birthdate": null,
      },
      {
        "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
        "u.firstName": "John",
        "u.lastName": "Doe",
        "u.username": "JohnDoe",
        "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);
  });

  describe("CTEs", async () => {
    test("where", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .with("p", (qb) => qb.from("pet", Pets).select("pet", "userId", "uid"))

        .where("u", "id", "IN", (qb) => qb.from("p").select("p", "uid"))

        .getEntities();

      expect(res).toHaveLength(1);

      TestHelper.validateObject(res[0]!, user1);
    });

    test("join", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .with("p", (qb) => qb.from("pet", Pets).select("pet", "userId", "uid"))

        .innerJoin("pu", "p", (j) => j.on("pu", "uid", "=", "u", "id"))

        .getRaw();

      expect(res).toHaveLength(2);

      expect(res).toEqual([
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "u.firstName": "John",
          "u.lastName": "Doe",
          "u.username": "JohnDoe",
          "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
        },
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "u.firstName": "John",
          "u.lastName": "Doe",
          "u.username": "JohnDoe",
          "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
        },
      ]);
    });
  });

  test("groupBy", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .leftJoin("p", Pets, (j) => j.relation("u", "pets"))
      .selectSQL("COUNT(p.id)::INT", "count")
      .select("u", "username", "username")
      .orderBy("u", "username")
      .groupBy("u", "username")
      .getRaw();

    expect(res).toEqual([
      { username: user2.username, count: 0 },
      { username: user1.username, count: 2 },
    ]);
  });

  describe("distinct", async () => {
    test("distinct", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .crossJoin("p", Pets)
        .crossJoin("p2", Pets)
        .select("u", "id")
        .distinct()
        .orderBy("u", "id")
        .getRaw();

      expect(res).toStrictEqual([
        { "u.id": "406b635b-508e-4824-855d-fb71d77bcdac" },
        { "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7" },
      ]);
    });

    test("distinctOn", async () => {
      const res = await TEST_DB.queryBuilder("u", Users)
        .crossJoin("p", Pets)
        .crossJoin("p2", Pets)
        .select("u", "id")
        .select("p", "id")
        .distinctOn("u", "id")
        .distinctOn("p", "id")
        .orderBy("u", "id")
        .orderBy("p", "id")
        .getRaw();

      expect(res).toStrictEqual([
        {
          "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
          "p.id": "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
        },
        {
          "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
          "p.id": "bec37141-f990-4960-a03c-d78b43bc4c8e",
        },
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "p.id": "388a73d0-1dbb-45cb-b7d2-0cefea41f92b",
        },
        {
          "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
          "p.id": "bec37141-f990-4960-a03c-d78b43bc4c8e",
        },
      ]);
    });
  });

  test("limit", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .orderBy("u", "username")
      .limit(1)
      .getRaw();

    expect(res).toEqual([
      {
        "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
        "u.firstName": "Kyriakos",
        "u.lastName": "Grizzly",
        "u.username": "AAAAAAAAAAA",
        "u.birthdate": null,
      },
    ]);

    const res2 = await TEST_DB.queryBuilder("u", Users)
      .orderBy("u", "username")
      .limit(20)
      .getRaw();

    expect(res2).toEqual([
      {
        "u.id": "406b635b-508e-4824-855d-fb71d77bcdac",
        "u.firstName": "Kyriakos",
        "u.lastName": "Grizzly",
        "u.username": "AAAAAAAAAAA",
        "u.birthdate": null,
      },
      {
        "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
        "u.firstName": "John",
        "u.lastName": "Doe",
        "u.username": "JohnDoe",
        "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);
  });

  test("offset", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .orderBy("u", "username")
      .offset(1)
      .getRaw();

    expect(res).toEqual([
      {
        "u.id": "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
        "u.firstName": "John",
        "u.lastName": "Doe",
        "u.username": "JohnDoe",
        "u.birthdate": new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);

    const res2 = await TEST_DB.queryBuilder("u", Users)
      .orderBy("u", "username")
      .offset(5)
      .getRaw();

    expect(res2).toEqual([]);
  });
});
