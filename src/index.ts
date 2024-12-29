import { Client } from "pg";
import { Users } from "./users";
import { Entity } from "./types/entity";
import { METADATA_STORE } from "./metadata-store";
import { WhereCondition, Wheres } from "./types/where-args";
import { quote } from "./quote";

const buildSelect = <T extends Entity<unknown>>(
  e: T,
  where?: Wheres<InstanceType<T>>
): string => {
  const metadata = METADATA_STORE.getTable(e);

  const targets = metadata.columns
    .map((c) => `${c.fullName} AS "${metadata.klass.name}.${c.fieldName}"`)
    .join(", ");

  const whereConditions: string[] = [];
  if (where) {
    const getComparator = (comparator: WhereCondition): string => {
      const data = new Map<WhereCondition, string>([
        ["gt", ">"],
        ["gte", ">="],
        ["lt", "<"],
        ["lte", "<="],
        ["eq", "="],
        ["not-eq", "!="],
      ]);

      const res = data.get(comparator);
      if (!res) {
        throw new Error(`Invalid comparator ${comparator}`);
      }

      return res;
    };

    for (const fieldName of Object.keys(where)) {
      const column = metadata.columnsMap.get(fieldName);
      if (!column) {
        throw new Error(
          `Column ${fieldName} not found in table ${metadata.klass.name}`
        );
      }
      const condition = where[fieldName as keyof InstanceType<T>]!;

      const comparator = getComparator(condition.condition);

      whereConditions.push(
        `${column.fullName} ${comparator} ${quote(condition.value)}`
      );
    }
  }

  let sql = `SELECT ${targets} FROM ${metadata.tablename}`;
  if (whereConditions) {
    sql += " WHERE " + whereConditions.join(" AND ");
  }

  return sql;
};

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const sql = buildSelect(Users, {
    username: { value: "a", condition: "gte" },
  });

  console.log(sql);
  console.log((await client.query(sql)).rows);
};

main();
