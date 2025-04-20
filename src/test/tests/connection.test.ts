import { describe, expect, test } from "vitest";
import { TEST_DB } from "../client";

describe("connection", async () => {
  test("sets config", async () => {
    const conn = await TEST_DB.getConnection({
      logging: { collectSql: true },
      postgresConfig: { work_mem: "512MB" },
    });

    expect(conn.$sqlLog).toStrictEqual([
      { params: [], sql: `SET work_mem = '512MB'` },
    ]);
  });

  test("sets config in withConnection", async () => {
    await TEST_DB.withConnection(
      {
        logging: { collectSql: true },
        postgresConfig: { work_mem: "512MB" },
      },
      (conn) => {
        expect(conn.$sqlLog).toStrictEqual([
          { params: [], sql: `SET work_mem = '512MB'` },
        ]);
      }
    );
  });
});
