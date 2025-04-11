import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { JoinNode, Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { QueryBuilder } from "./query-builder";
import { AnEntity } from "./types";
import { PostgresClient } from "./postgres-client";

const main = async () => {
  const DB = new PostgresClient({
    databaseUrl: "postgres://petr@localhost:5437/tygress",
    ssl: false,
    entities: [],
  });

  const builder = DB.queryBuilder("pet", Pets)
    .with("u", (qb) => qb.from("asdf", Users).select("asdf", "id", "id"))
    .with("uu", (qb) => qb.from("u").select("u", "id", "id"))

    .join("asdf", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf2", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf3", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf4", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf5", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf6", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf7", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf8", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf9", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))
    .join("asdf10", "u", (j) => j.on("asdf", "id", "<=", "pet", "userId"))

    .select("asdf", "id")
    .select("pet", "userId");

  const a = await builder.getRaw();

  console.log(a);

  // console.log(
  //   await DB.select(Users, {
  //     where: { id: 1 },
  //     select: {
  //       id: true,
  //       fullName: true,
  //       username: true,
  //       pets: { id: true, name: true },
  //     },
  //   })
  // );

  // const { rows } = await DB.insert(
  //   Users,
  //   [{ username: "asdasdasd", fullName: "adasdasgsdfd" }],
  //   {
  //     returning: "*",
  //   }
  // );

  // console.log(rows);

  // const { rows: updatedRows } = await DB.update(
  //   Users,
  //   { username: "joaha" },
  //   { id: In(rows.map((e) => e.id)) },
  //   { returning: "*" }
  // );

  // console.log(updatedRows);

  // const { rows: deletedRows } = await DB.delete(
  //   Users,
  //   {
  //     id: In(rows.map((e) => e.id)),
  //   },
  //   { returning: "*" }
  // );

  // console.log(deletedRows);
};

main();
