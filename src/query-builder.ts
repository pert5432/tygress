import { METADATA_STORE, TableMetadata } from "./metadata";
import { Entity, Joins, SelectOptions, WhereCondition } from "./types";
import { doubleQuote, quote } from "./utils";

export class QueryBuilder<T extends Entity<unknown>> {
  constructor(
    private entity: T,
    private options: SelectOptions<InstanceType<T>>
  ) {
    this.table = METADATA_STORE.getTable(this.entity);
  }

  private table: TableMetadata;
  private tablesToSelect: TableMetadata[] = [];
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];

  public buildSelect<T>(): string {
    this.tablesToSelect.push(this.table);

    this.buildWhere();
    this.buildJoins();

    const targets = this.tablesToSelect
      .map((t) =>
        t.columns.map(
          (c) =>
            `${c.fullName} AS ${doubleQuote(`${t.klass.name}.${c.fieldName}`)}`
        )
      )
      .flat()
      .join(", ");

    let sql = `SELECT ${targets} FROM ${this.table.tablename}`;

    if (this.sqlJoins.length) {
      sql += ` ${this.sqlJoins.join(" ")}`;
    }

    if (this.whereConditions.length) {
      sql += " WHERE " + this.whereConditions.join(" AND ");
    }

    return sql;
  }

  private buildWhere(): void {
    if (this.options?.where) {
      const { where } = this.options;

      for (const fieldName of Object.keys(where)) {
        const column = this.table.columnsMap.get(fieldName);
        if (!column) {
          throw new Error(
            `Column ${fieldName} not found in table ${this.table.klass.name}`
          );
        }

        const condition = where[fieldName as keyof InstanceType<T>]!;
        const comparator = this.getComparator(condition.condition);

        this.whereConditions.push(
          `${column.fullName} ${comparator} ${quote(condition.value)}`
        );
      }
    }
  }

  private buildJoins(): void {
    if (!this.options?.joins) {
      return;
    }

    const { joins } = this.options;

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
          this.sqlJoins.push(
            `INNER JOIN ${inverseMeta.fullName} ON ${relation.fullForeignKey} = ${relation.fullPrimaryKey}`
          );

          // Make sure we select columns from this table
          this.tablesToSelect.push(inverseMeta);
        }

        if (_join instanceof Object) {
          join(
            _joins[key as keyof Joins<E>]!,
            METADATA_STORE.getTable(inverseTable)
          );
        }
      }
    };

    join(joins, this.table);
  }

  private getComparator = (comparator: WhereCondition): string => {
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
}
