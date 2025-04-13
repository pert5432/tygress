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
});
