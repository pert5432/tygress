import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const users = await Repository.select(client, Users, {
    where: { pets: { name: Not(Lt("a")) } },
    joins: {
      pets: true,
    },
  });

  console.log(users[0]);
};

main();
