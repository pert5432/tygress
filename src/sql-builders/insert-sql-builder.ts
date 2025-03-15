import { ColumnMetadata, TableMetadata } from "../metadata";
import { InsertArgs } from "../types";
import { Insert } from "../types/insert";
import { dQ } from "../utils";
import { ParamBuilder } from "./param-builder";

export class InsertSqlBuilder {
  private entity: TableMetadata;
  private columns: ColumnMetadata[];
  private values: Object[];

  private paramBuilder: ParamBuilder;

  constructor({ entity, columns, values, paramBuilder }: InsertArgs) {
    this.entity = entity;
    this.columns = columns;
    this.values = values;
    this.paramBuilder = paramBuilder;
  }

  sql(): Insert {
    let sql = `INSERT INTO ${this.entity.dmlIdentifier.sql()}`;

    sql += ` (${this.columns.map((c) => dQ(c.name)).join(", ")})`;

    sql += ` VALUES ${this.values.map((e) => this.serializeRow(e)).join(", ")}`;

    return {
      sql,
      params: this.paramBuilder.params,
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

    return `$${this.paramBuilder.addParam(value)}`;
  }
}
