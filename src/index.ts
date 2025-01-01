import "reflect-metadata";
import { Client } from "pg";
import { Users } from "./users";
import { Entity } from "./types/entity";
import { METADATA_STORE } from "./metadata/metadata-store";
import { WhereCondition } from "./types/where-args";
import { quote } from "./quote";
import { doubleQuote } from "./double-quote";
import { SelectOptions } from "./types/select-options";
import { TableMetadata } from "./metadata/table-metadata";
import { Joins } from "./types/join-args";

const buildSelect = <T extends Entity<unknown>>(
  e: T,
  options?: SelectOptions<InstanceType<T>>
): string => {
  const metadata = METADATA_STORE.getTable(e);

  const tablesToSelect: TableMetadata[] = [metadata];

  const whereConditions: string[] = [];
  if (options?.where) {
    const { where } = options;

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

  const sqlJoins: string[] = [];
  if (options?.joins) {
    const { joins } = options;

    const join = <E>(_joins: Joins<E>, currentTable: TableMetadata): void => {
      for (const key of Object.keys(_joins)) {
        const _join = _joins[key as keyof Joins<E>]!;

        const relation = currentTable.relations.get(key);
        if (!relation) {
          throw new Error(
            `No relation found on table ${currentTable}, field ${key}`
          );
        }

        const inverseTable =
          relation.primary === currentTable.klass
            ? relation.foreign
            : relation.primary;

        const inverseMeta = METADATA_STORE.getTable(inverseTable);

        if (_join === true || _join instanceof Object) {
          sqlJoins.push(
            `INNER JOIN ${inverseMeta.fullName} ON ${relation.fullForeignKey} = ${relation.fullPrimaryKey}`
          );

          // Make sure we select columns from this table
          tablesToSelect.push(inverseMeta);
        }

        if (_join instanceof Object) {
          join(
            _joins[key as keyof Joins<E>]!,
            METADATA_STORE.getTable(inverseTable)
          );
        }
      }
    };

    join(joins, metadata);
  }

  const targets = tablesToSelect
    .map((t) =>
      t.columns.map(
        (c) =>
          `${c.fullName} AS ${doubleQuote(`${t.klass.name}.${c.fieldName}`)}`
      )
    )
    .flat()
    .join(", ");

  let sql = `SELECT ${targets} FROM ${metadata.tablename}`;

  if (sqlJoins.length) {
    sql += ` ${sqlJoins.join(" ")}`;
  }

  if (whereConditions.length) {
    sql += " WHERE " + whereConditions.join(" AND ");
  }

  return sql;
};

const main = async () => {
  const client = new Client("postgres://petr@localhost:5437/tygress");
  await client.connect();

  const sql = buildSelect(Users, {
    where: { username: { value: "a", condition: "gte" } },
    joins: {
      pets: true,
    },
  });

  console.log(sql);
  console.log((await client.query(sql)).rows);
};

main();
