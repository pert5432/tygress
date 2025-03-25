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
    .join("usr", Users, (j) =>
      j.sql("usr.id = pet.userId AND usr.fullName > LOWER(:name)", {
        name: "asdasd",
      })
    )

    .with("u", (qb) => qb.from("asdf", Users).select("asdf", "id", "id"))
    .with("uu", (qb) => qb.from("u").select("u", "id", "id"))
    .where("usr", "id", "<=", (qb) =>
      qb.from("uu", Users).selectSQL("MAX(uu.id)", "id")
    );

  const a = await builder.getEntities();

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
