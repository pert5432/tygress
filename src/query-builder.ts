import { METADATA_STORE, TableMetadata } from "./metadata";
import {
  Entity,
  Joins,
  SelectOptions,
  WhereCondition,
  WhereComparator,
  Wheres,
} from "./types";
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

  public buildSelect(): string {
    this.tablesToSelect.push(this.table);

    this.buildWhereConditions();
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

  private buildWhere<P>(table: TableMetadata, where: Wheres<P>): void {
    for (const fieldName in where) {
      let column = table.columnsMap.get(fieldName);

      // Fetch the column meta from a relation instead
      // Maybe this should be a different branch alltogether (i.e. we want to handle conditions for columns and for relations separately)
      if (!column) {
        const relation = table.relations.get(fieldName);

        if (relation) {
          const { field, klass } = relation.getOtherSide(table.klass);
          const otherTable = METADATA_STORE.getTable(klass);

          column = otherTable.columnsMap.get(field);
        }
      }

      if (!column) {
        throw new Error(
          `Column ${fieldName} not found in table ${table.klass.name}`
        );
      }

      const condition = where[fieldName as keyof Wheres<P>]!;

      if (condition instanceof WhereCondition) {
        const comparator = this.getSqlComparator(condition.condition);

        this.whereConditions.push(
          `${column.fullName} ${comparator} ${quote(condition.value)}`
        );
      } else {
        const nextTableRelation = table.relations.get(fieldName);
        if (!nextTableRelation) {
          throw new Error(
            `No relation for table ${table.klass.name}, column ${fieldName}`
          );
        }

        this.buildWhere(
          METADATA_STORE.getTable(nextTableRelation.getOtherTable(table.klass)),
          condition
        );
      }
    }
  }

  private buildWhereConditions(): void {
    if (!this.options.where) {
      return;
    }

    const { where } = this.options;
    this.buildWhere(this.table, where);
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

        const inverseTable = relation.getOtherTable(currentTable.klass);
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

  private getSqlComparator = (comparator: WhereComparator): string => {
    const data = new Map<WhereComparator, string>([
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
