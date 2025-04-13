import { beforeAll, describe, expect, test } from "vitest";
import { TEST_DB } from "../client";
import { Users } from "../entities/users";
import { TestHelper } from "../helpers";

describe("QueryBuilder", async () => {
  const user = {
    firstName: "John",
    lastName: "Doe",
    username: "JohnDoe",
    birthdate: new Date("2020-01-01"),
  };

  beforeAll(async () => {
    await TestHelper.trunc();

    await TEST_DB.insert(Users, [user]);
  });

  test("works", async () => {
    const res = await TEST_DB.queryBuilder("u", Users).getEntities();

    expect(res).toHaveLength(1);

    TestHelper.validateObject(res[0]!, user);
  });
});
