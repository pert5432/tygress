import { Client } from "pg";
import { A } from "./a";

console.log(A);

class Column {
  constructor(name: string, fieldName: string) {
    this.name = name;
    this.fieldName = fieldName;
  }

  name: string;

  fieldName: string;
}

class Entity {
  constructor(name: string, className: string, columns: Column[]) {
    this.name = name;
    this.className = className;
    this.columns = columns;
  }

  name: string;

  className: string;

  columns: Column[];
}

const buildSelect = (e: Entity): string => {
  const targets = e.columns
    .map((c) => `${e.name}.${c.name} AS "${e.className}.${c.fieldName}"`)
    .join(", ");

  return `SELECT ${targets} FROM ${e.name}`;
};

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const users = new Entity("users", "Users", [
    new Column("id", "ID"),
    new Column("username", "Username"),
    new Column("full_name", "FullName"),
  ]);

  const sql = buildSelect(users);

  console.log(sql);

  console.log((await client.query(sql)).rows);
};

main();
