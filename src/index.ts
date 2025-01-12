import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { METADATA_STORE } from "./metadata";
import { QueryBuilder } from "./query-builder";

const main = async () => {
  // const builder = new QueryBuilder({ pet: Pets })
  //   .add({
  //     asdf: Users,
  //   })
  //   .add({ pervitin: Pets });

  // const a = builder.join("asdf", "pets", { piko: Pets });

  // a.has("piko");

  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

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
