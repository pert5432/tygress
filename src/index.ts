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
    .joinAndSelect("usr", Users, "pet", "user")
    .with("u", DB.queryBuilder("asdf", Users).select("asdf", "id", "id"))
    .with("uu", DB.queryBuilder("asdf", Users).select("asdf", "id", "id"))
    .select("pet", "name")
    .select("pet", "id")
    .select("pet", "userId")
    .select("usr", "id")
    .orderBy("pet", "name", "DESC")

    .whereIn("usr", "id", (qb) => qb.from("uwu", Users).select("uwu", "id"));

  const a = await builder.getEntities();

  console.log(a);
};

main();
