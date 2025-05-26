import { expect } from "vitest";
import { TEST_DB } from "./client";
import { TygressEntityMarker } from "../tygress-entity";

export abstract class TestHelper {
  static validateObject(a: Record<string, any>, b: Record<string, any>) {
    for (const key of Object.keys(b)) {
      if (key === TygressEntityMarker) {
        continue;
      }

      expect(a[key]).toStrictEqual(b[key]);
    }
  }

  static async trunc(): Promise<void> {
    const res = await TEST_DB.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename <> $2`,
      ["public", "tygress_migrations"]
    );

    const query = res.rows
      .map((e) => `TRUNCATE TABLE ${e.tablename} CASCADE;`)
      .join(" \n");

    await TEST_DB.query(query);
  }
}
