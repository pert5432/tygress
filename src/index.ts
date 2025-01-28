import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { QueryBuilder } from "./query-builder";
import { QueryRunner } from "./query-runner";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  // const builder = new QueryBuilder({ pet: Pets })
  //   .join(
  //     {
  //       piko: Users,
  //     },
  //     "pet",
  //     "user"
  //   )
  //   .join({ asdf: Pets }, `asdf.name ILIKE '%o%'`);

  // const runner = new QueryRunner(client, builder.getQuery());

  // console.log(await runner.run());

  const users = await Repository.select(client, Users, {
    joins: {
      pets: true,
    },
    where: {
      pets: { name: In(["a", "pootis", "moofis"]) },
    },
    order: {
      pets: { name: "DESC" },
      fullName: "ASC",
    },
  });

  console.log(users[0]);
};

main();
