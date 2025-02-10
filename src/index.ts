import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { JoinNode, Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { QueryBuilder } from "./query-builder";
import { AnEntity } from "./types";

const createQueryBuilder = <A extends string, E extends AnEntity>(
  alias: A,
  entity: E
) => new QueryBuilder<E, Record<A, E>>(alias, entity);

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const builder = createQueryBuilder("pet", Pets)
    .joinAndSelect("piko", Users, "pet", "user")
    .where("pet.name IN(:names)", {
      names: ["pootis", "moofis"],
    })
    .selectRaw("STRING_AGG(pet.name, ', ')", "cc");

  const a = await builder.getRaw(client);

  console.log(a);

  // const users = await Repository.select(client, Users, {
  //   joins: {
  //     pets: true,
  //   },
  // select: {
  //   fullName: true,
  //   pets: { name: true, user: { id: true } },
  // },
  // where: {
  //   pets: { name: In(["a", "pootis", "moofis"]) },
  // },
  // order: {
  //   pets: { name: "DESC", user: { id: "DESC" } },
  //   fullName: "ASC",
  // },
  // });

  // console.log(users[0]);
};

main();
