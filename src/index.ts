import { Client } from "pg";
import { Users } from "./users";
import { Entity } from "./types/entity.type";
import { METADATA_STORE } from "./metadata-store";

const buildSelect = (e: Entity<unknown>): string => {
  const metadata = METADATA_STORE.get(e);
  console.log(metadata);

  const targets = metadata.columns
    .map(
      (c) =>
        `${metadata.tablename}.${c.name} AS "${metadata.className}.${c.fieldName}"`
    )
    .join(", ");

  return `SELECT ${targets} FROM ${metadata.tablename}`;
};

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const sql = buildSelect(Users);

  console.log(sql);

  console.log((await client.query(sql)).rows);
};

main();
