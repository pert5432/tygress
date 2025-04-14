import { TEST_DB } from "../client";
import { beforeAll, describe, expect, test } from "vitest";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";
import { Pets } from "../entities/pets";

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

    console.log(res);

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
});
