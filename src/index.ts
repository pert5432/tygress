import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const users = await Repository.select(client, Users, {
    where: { pets: { name: "moofis" } },
    joins: {
      pets: true,
    },
  });

  console.log(users[0]);

  // console.log(
  //   await Repository.select(client, Pets, {
  //     joins: {
  //       user: true,
  //     },
  //   })
  // );
};

main();
