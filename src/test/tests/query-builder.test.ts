import { TEST_DB } from "../client";
import { beforeAll, describe, expect, test } from "vitest";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";
import { Pets } from "../entities/pets";
import { In, Lte } from "../../api";

describe("QueryBuilder", async () => {
  const user1 = {
    id: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    firstName: "John",
    lastName: "Doe",
    username: "JohnDoe",
    birthdate: new Date("2020-01-01"),
  };

  const pet1 = {
    userId: "5c15d031-000b-4a87-8bb5-2e7b00679ed7",
    name: "Pootis",
  };

  const pet2 = {
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

  test("inner join", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .innerJoinAndSelect("p", Pets, (j) => j.relation("u", "pets"))
      .getEntities();

    expect(res).toHaveLength(1);

    const user = res[0]!;

    expect(user.pets).toHaveLength(2);
  });

  test("left join", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .leftJoinAndSelect("p", Pets, (j) => j.relation("u", "pets"))
      .orderBy("u", "username", "ASC")
      .getEntities();

    expect(res).toHaveLength(2);

    expect(res[0]!.pets).toHaveLength(0);
    expect(res[1]!.pets).toHaveLength(2);
  });

  test("explicit join", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .innerJoin("p", Pets, (j) => j.on("p", "userId", "=", "u", "id"))
      .getEntities();

    expect(res).toHaveLength(1);

    TestHelper.validateObject(res[0]!, user1);
  });

  test("sql join", async () => {
    const res = await TEST_DB.queryBuilder("u", Users)
      .innerJoin("p", Pets, (j) => j.sql("p.userId = u.id"))
      .getEntities();

    expect(res).toHaveLength(1);

    TestHelper.validateObject(res[0]!, user1);
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
});
