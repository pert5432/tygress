import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { ColumnMetadata, TableMetadata } from "../metadata";
import { AnEntity } from "../types";
import { Insert, InsertSqlArgs } from "../types/insert";
import { TargetNode } from "../types/query";
import { dQ, entityNameToAlias } from "../utils";
import { NakedColumnIdentifierSqlBuilder } from "./column-identifier";
import { ConstantBuilder } from "./constant-builder";

export class InsertSqlBuilder {
  private args: InsertSqlArgs;

  private entity: TableMetadata;
  private columns: ColumnMetadata[];
  private values: Object[];

  private returning: ColumnMetadata[];

  private constBuilder: ConstantBuilder;

  private targetNode: TargetNode<AnEntity>;

  private columnIdentifiers: NakedColumnIdentifierSqlBuilder[];

  constructor(args: InsertSqlArgs) {
    const { entity, columns, values, constBuilder, returning } = args;

    this.args = args;

    this.entity = entity;
    this.columns = columns;
    this.values = values;
    this.constBuilder = constBuilder;

    this.returning = returning;

    this.columnIdentifiers = columns.map((c) =>
      ColumnIdentifierSqlBuilderFactory.createNaked(c)
    );
  }

  sql(): Insert {
    let sql = `INSERT INTO ${this.entity.dmlIdentifier.sql()}`;

    sql += ` (${this.columnIdentifiers.map((e) => e.sql()).join(", ")})`;

    sql += ` VALUES ${this.values.map((e) => this.serializeRow(e)).join(", ")}`;

    if (this.args.onConflict) {
      const columnIdentifiers = this.args.conflictColumns.map((c) =>
        ColumnIdentifierSqlBuilderFactory.createNaked(c)
      );

      if (this.args.onConflict === "DO UPDATE") {
        if (!columnIdentifiers.length) {
          throw new Error(
            `ON CONFLICT DO UPDATE requires a list of conflict columns`
          );
        }

        if (!this.args.updateColumns.length) {
          throw new Error(
            `ON CONFLICT DO UPDATE requires a list of columns to update`
          );
        }
      }

      const conflictColumnsSql = columnIdentifiers?.length
        ? `(${columnIdentifiers.map((e) => e.sql()).join(", ")})`
        : "";

      sql += ` ON CONFLICT`;

      if (this.args.onConflict === "DO NOTHING") {
        sql += ` ${conflictColumnsSql} DO NOTHING`;
      } else if (this.args.onConflict === "DO UPDATE") {
        sql += ` ${conflictColumnsSql} DO UPDATE`;

        const updateColumnIdentifiers = this.args.updateColumns.map((e) =>
          ColumnIdentifierSqlBuilderFactory.createNaked(e)
        );

        sql += ` SET ${updateColumnIdentifiers.map(
          (e) => `${e.sql()} = EXCLUDED.${e.sql()}`
        )}`;
      } else {
        throw new Error(`Invalid ON CONFLICT clause ${this.args.onConflict}`);
      }
    }

    if (this.returning.length) {
      const alias = entityNameToAlias(this.entity.klass.name);
      const targets = this.returning.map((c) =>
        SelectTargetSqlBuilderFactory.createColumnIdentifier(
          ColumnIdentifierSqlBuilderFactory.createNaked(c),
          `${alias}.${c.fieldName}`,
          alias,
          c.fieldName
        )
      );

      sql += ` RETURNING ${targets
        .map((e) => e.sql(this.constBuilder))
        .join(", ")}`;

      this.targetNode = TargetNodeFactory.createRoot(this.entity.klass, alias);

      targets.forEach((e) => this.targetNode.selectField(e.fieldName, e.as));
    }

    return {
      sql,
      params: this.constBuilder.params,
      targetNode: this.targetNode,
    };
  }

  private serializeRow(row: { [key: string]: any }): string {
    return `(${this.columns.map((c) =>
      this.serializeValue(row[c.fieldName])
    )})`;
  }

  private serializeValue(value: any): string {
    if (value === undefined) {
      return "DEFAULT";
    }

    if (value === null) {
      return "NULL";
    }

    return this.constBuilder.addConst(value);
  }
}
