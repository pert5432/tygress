import { describe, expect, test, vi } from "vitest";
import { TEST_DB } from "../client";
import { PostgresConnection } from "../../postgres-connection";

describe("connection", async () => {
  test("sets config", async () => {
    const conn = await TEST_DB.getConnection({
      postgresConfig: { work_mem: "512MB" },
    });

    expect(conn.$sqlLog).toStrictEqual([
      { params: [], sql: `SET work_mem = '512MB'` },
    ]);
  });

  test("sets config in withConnection", async () => {
    await TEST_DB.withConnection(
      {
        postgresConfig: { work_mem: "512MB" },
      },
      (conn) => {
        expect(conn.$sqlLog).toStrictEqual([
          { params: [], sql: `SET work_mem = '512MB'` },
        ]);
      }
    );
  });

  test("can't run queries on a released connection", async () => {
    const conn = await TEST_DB.getConnection();

    conn.release();

    await expect(conn.query("SELECT 1")).rejects.toThrowError(
      new Error(
        "Can't run more commands on this connection because its state is RELEASED but it needs to be READY"
      )
    );
  });

  test("terminate connection in transaction on release", async () => {
    const conn = await TEST_DB.getConnection();

    await conn.begin();

    const spy = vi.spyOn(conn.$client, "release");

    conn.release();

    expect(spy).toHaveBeenCalledWith(true);
  });

  describe("withTransaction", () => {
    test("opens transaction, does not commit, releases connection", async () => {
      const conn = await TEST_DB.withTransaction((c) => {
        return c;
      });

      // transaction started
      expect(conn.$sqlLog).toStrictEqual([{ params: [], sql: "BEGIN;" }]);

      // connection is released
      await expect(conn.query("SELECT 1")).rejects.toThrowError(
        new Error(
          "Can't run more commands on this connection because its state is RELEASED but it needs to be READY"
        )
      );
    });

    test("rolls back and re-throws on error", async () => {
      let conn: PostgresConnection;

      await expect(
        TEST_DB.withTransaction((c) => {
          conn = c;

          throw new Error("hamburger");
        })
      ).rejects.toThrowError(new Error("hamburger"));
      //@ts-expect-error
      expect(conn.$sqlLog).toStrictEqual([
        { params: [], sql: "BEGIN;" },
        { params: [], sql: "ROLLBACK;" },
      ]);
    });
  });
});
