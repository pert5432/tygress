import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { WhereCondition } from "./types";
import { Pets } from "./experiments/pets";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const a = new WhereCondition<string>();
  a.value = "a";
  a.condition = "gt";

  console.log(
    await Repository.select(client, Users, {
      where: { pets: { name: a } },
      joins: {
        pets: true,
      },
    })
  );

  console.log(
    await Repository.select(client, Pets, {
      joins: {
        user: true,
      },
    })
  );
};

main();
