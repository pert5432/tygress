Tygress is an ORM connecting NodeJS and Postgres.

## Main goals 🎯

- Support all Postgres features to get the most out of your database
  - Including changing Postgres config, per-table overrides, explicit locking, DDL etc...
- Have minimum performance overhead and maximum control
  - You should have full control over which columns and how many rows you select
  - It should be clear what queries are ran where so Tygress API functions aim to only execute 1 query per call
- Have full type safety
  - This includes query results, building the queries themselves and other interactions with Postgres
- Keep simple queries simple but offer solid support for building complex ones

## Usage 💯

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

export const DB = new PostgresClient({
  databaseUrl: "postgres://username:password@host:5432/database",
});
```

And from there you can run queries based on the examples below :)

## Current features ✅

- Complex query builder including:

  - Type safety for results and for building queries
  - `JOIN`s
  - Subqueries
  - `CTE`s
  - `GROUP BY`
  - `DISTINCT (ON)`
  - `ORDER BY`
  - `LIMIT` / `OFFSET`
  - Returning raw results or class instances

- Simple selects with `WHERE`, `JOIN`, `ORDER`, `LIMIT` / `OFFSET`
- Inserts, Upserts via `ON CONFLICT`
- Updates
- Deletes
- Connection and transaction management
- Changing Postgres settings

## Upcoming features (ordered by priority) 🚧

- Migration support
  - Index management
  - Table config overrides (for ex. vacuum settings)
  - Managing views and materialized views
- Inserts/Updates/Deletes using query builder
  - To support `INSERT INTO a SELECT ...`
  - Or `DELETE FROM a WHERE id IN(SELECT ...)` etc...
- Type hinting for popular extensions, for ex. PostGIS

## Feedback 🗣️

Do you have feedback, suggestions or feature requests? Feel free to open an issue or a discussion in this repo.

## Example usage

You need to define your tables as classes and decorate them with Tygress decorators:

```typescript
@Table("users")
export class Users {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "first_name", type: "TEXT" })
  firstName: string;

  @Column({ name: "last_name", type: "TEXT" })
  lastName: string;

  @OneToMany(() => Pets, "user")
  pets: Pets[];
}

@Table("pets")
export class Pets {
  @PrimaryKey({ name: "id", type: "UUID" })
  id: string;

  @Column({ name: "user_id", type: "UUID" })
  userId: string;

  @Column({ name: "name", type: "TEXT" })
  name: string;

  @ManyToOne(() => Users, "pets", "userId")
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

## Migrations ⚠️

### CLI

To be able to run migrations using the CLI you need to specify an instance of `PostgresClient` with the `migrationFolders` option specified:

```typescript
import path from "node:path";
import { PostgresClient } from "tygress";

export default new PostgresClient({
  databaseUrl: "postgres://username:password@host:5432/database",

  migrationFolders: [path.join(__dirname, "src", "migrations")],
});
```

`tygress migration:generate Name` to generate a migration that will make your DB schema match Tygress entities \
`tygress migration:blank Name` to create an empty migration \
`tygress migration:run` to run all pending migrations \
`tygress migration:rollback` to rollback the last executed migration

You can either put the `PostgresClient` you want to use for migrations in `tygress-client.ts` in the folder where you run migrations from or you can specify the path to the file like `--config ./src/tygress-client.ts`.

### Programmatically

You can use functions on the `PostgresClient` to do everything you can do with the CLI.

`await DB.generateMigration(name)` to generate a migration that will make your DB schema match Tygress entities \
`await DB.createBlankMigration("Name")` to create an empty migration \
`await DB.runMigrations()` to run all pending migrations \
`await DB.rollbackLastMigration()` to rollback the last executed migration
