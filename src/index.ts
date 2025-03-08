import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { JoinNode, Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { createQueryBuilder, QueryBuilder } from "./query-builder";
import { AnEntity } from "./types";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const builder = createQueryBuilder("pet", Pets)
    .joinAndSelect("usr", Users, "pet", "user")
    .with("u", createQueryBuilder("asdf", Users).select("asdf", "id", "id"))
    .select("pet", "name")
    .select("pet", "id")
    .select("pet", "userId")
    .select("usr", "id")
    .orderBy("pet", "name", "DESC")

    .whereInCTE("pet", "id", "u", (qb) => qb.select("u", "id"));

  const a = await builder.getEntities(client);

  console.log(a);
};

main();
