import { expect } from "vitest";
import { TEST_DB } from "./client";

export abstract class TestHelper {
  static validateObject(a: Record<string, any>, b: Record<string, any>) {
    for (const key of Object.keys(b)) {
      expect(a[key]).toStrictEqual(b[key]);
    }
  }

  static async trunc(): Promise<void> {
    const res = await TEST_DB.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );

    const query = res.rows
      .map((e) => `TRUNCATE TABLE ${e.tablename} CASCADE;`)
      .join(" \n");

    await TEST_DB.query(query);
  }
}
