Tygress is an ORM connecting NodeJS and Postgres.

## Main goals 🎯

- Support all Postgres features
  - Including Postgres config, per-table overrides, explicit locking, DDL etc...
- Have minimum performance overhead and maximum control
  - You should have full control over which columns and how many rows you select
  - It should be clear what queries are ran where so Tygress API functions aim to only execute 1 query
- Have full type safety
  - This includes query results and building the queries themselves
- Keep simple queries simple but offer support for building complex ones

## Usage

Run `yarn add tygress` / `npm install tygress`.

Make sure you have decorators enabled in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Initialize the client:

```typescript
import { PostgresClient } from "tygress";

const DB = new PostgresClient({
  databaseUrl: "postgres://username:password@host:5432/database",
  entities: [],
});
```

And from there you can run queries based on the examples below :)

## Current features ✅

- Complex query builder including support for:

  - `JOIN`s
  - `CTE`s
  - Subqueries
  - Type safety for results and for building queries
  - `GROUP BY`
  - `DISTINCT (ON)`
  - `ORDER BY`
  - `LIMIT` / `OFFSET`
  - Returning raw results or class instances

- Simple selects with `WHERE`, `JOIN`, `ORDER`, `LIMIT` / `OFFSET`
- Inserts, Upserts via `ON CONFLICT`
- Updates by `WHERE` condition
- Deletes by `WHERE` condition
- Connection and transaction management
- Changing Postgres settings

## Upcoming features (ordered by priority) 🚧

- Migration support
  - Generating migrations
  - Index management
  - Table overrides (for ex. vacuum settings)
- Support (materialized) views
  - Materialized views refreshing
- Inserts/Updates/Deletes using query builder
  - To support `INSERT INTO a SELECT ...`
  - Or `DELETE FROM a WHERE id IN(SELECT ...)`
- Type hinting for popular extensions, for ex. PostGIS

## Example usage

You need to define your tables as classes and decorate them with Tygress decorators:

```typescript
@Table("users")
export class Users {
  @PrimaryKey("id")
  id: string;

  @Column("first_name")
  firstName: string;

  @Column("last_name")
  lastName: string;

  @OneToMany(Pets, "user")
  pets: Pets[];
}

@Table("pets")
export class Pets {
  @PrimaryKey("id")
  id: string;

  @Column("user_id")
  userId: string;

  @Column("name")
  name: string;

  @ManyToOne(Users, "pets", "userId")
  user: Users;
}
```

You can then make simple queries like this:

```typescript
const users = await DB.select(Users, {
  joins: {
    pets: true,
  },
});
/*
[
  Users {
    id: '5c15d031-000b-4a87-8bb5-2e7b00679ed7',
    firstName: 'John',
    lastName: 'Doe',
    pets: [ [Pets], [Pets] ]
  }
]
*/

const users = await DB.select(Users, {
  where: {
    name: "Kyriakos",
  },
});
/*
[
  Users {
    id: 'd761c5b9-8130-4223-b2fb-3b9f0e231b36',
    firstName: 'Kyriakos',
    lastName: 'Grizzly',
    pets: undefined
  }
]
*/
```

Or build complex queries with the query builder:

```typescript
const users = await DB.queryBuilder("u", Users)
  .leftJoinAndMap("p", Pets, "u", "pets")
  .where("u", "firstName", "<", (qb) =>
    qb
      .from("a", Users)
      .setSelect("a", "firstName")
      .orderBy("a", "firstName", "DESC")
      .limit(1)
  )
  .getEntities();

/*
[
  Users {
    id: '5c15d031-000b-4a87-8bb5-2e7b00679ed7',
    firstName: 'John',
    lastName: 'Doe',
    pets: [ [Pets], [Pets] ]
  }
]
*/
```

Perform INSERT/UPDATE/DELETE:

```typescript
await DB.insert(Users, [
  {
    firstName: "John",
    lastName: "Doe",
  },
]);
// [Users { firstName: "John", lastName: "Doe" }]

await DB.update(Users, { firstName: "Joe" }, { firstName: "John" });
// [Users { firstName: "Joe", lastName: "Doe" }]

await DB.delete(Users, { firstName: "Joe" });
// []
```
