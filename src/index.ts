import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");

  console.log(
    await Repository.select(client, Users, {
      where: { username: { value: "a", condition: "gte" } },
      joins: {
        pets: true,
      },
    })
  );
};

main();
