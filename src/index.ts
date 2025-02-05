import { Client } from "pg";
import "reflect-metadata";
import { Users } from "./experiments/users";
import { Repository } from "./repository";
import { Pets } from "./experiments/pets";
import { And, Eq, Gt, In, Lt, Not, Or } from "./api";
import { QueryBuilder } from "./query-builder";
import { EntitiesQueryRunner } from "./entities-query-runner";
import { AnEntity } from "./types";

type MergeAll<T extends object[]> = T extends [infer First, ...infer Rest]
  ? First extends object
    ? Rest extends object[]
      ? First & MergeAll<Rest>
      : First
    : never
  : {};

type UnnestedEntityFields<
  T extends { [key: string]: InstanceType<AnEntity> },
  K extends keyof T
> = K extends string
  ? {
      [F in keyof T[K] as F extends string ? `${K}.${F}` : never]: T[K][F];
    }
  : never;

type RawEntities<T extends { [key: string]: InstanceType<AnEntity> }> = [
  { [K in keyof T]: T[K] }
];

type Split<T> = keyof T extends infer K
  ? K extends keyof T
    ? [{ [P in K]: T[P] }] | [...Split<Omit<T, K>>]
    : never
  : never;

type Entities = { a: Users; b: Pets; c: Users };

type EntitiesArray = [{ a: Users }, { b: Pets }, { c: Users }];

type A = MergeAll<EntitiesArray>;

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
    .where("pet.name IN(:names) AND pet.id > :num::INT", {
      names: ["pootis", "moofis"],
      num: 1,
    })
    .where("piko", "id", "lte", "pet", "id");

  const a = (await builder.getRaw(client))[0]!;

  console.log(a["pet.id"]);

  console.log(await builder.getRaw(client));

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
