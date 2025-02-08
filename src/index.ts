import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { QueryBuilder } from "./query-builder";

type Cringe = { name: string; height: number };

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const builder = new QueryBuilder({ pet: Pets })
    .joinAndSelect(
      {
        piko: Users,
      },
      "pet",
      "user"
    )
    .where("pet.name IN(:names) AND pet.id >= :num::INT", {
      names: ["pootis", "moofis"],
      num: 1,
    })
    .where("piko", "id", "lte", "pet", "id")
    .selectRaw<number, "aAs">("COUNT(1) FILTER (WHERE pet.id = :id)", "aAs", {
      id: 1,
    })
    .selectRaw("SUM(pet.id)", "asdasd", Number);
  // .selectRaw("pet.id IS NULL", "is_null", Boolean);

  const a = await builder.getRaw(client);

  console.log(a[0]);

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
