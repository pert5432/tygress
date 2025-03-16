import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { ColumnMetadata, TableMetadata } from "../metadata";
import { AnEntity, InsertSqlArgs } from "../types";
import { Insert } from "../types/insert";
import { TargetNode } from "../types/query";
import { dQ, entityNameToAlias } from "../utils";
import { ParamBuilder } from "./param-builder";

export class InsertSqlBuilder {
  private entity: TableMetadata;
  private columns: ColumnMetadata[];
  private values: Object[];

  private returning: ColumnMetadata[];

  private paramBuilder: ParamBuilder;

  private targetNode: TargetNode<AnEntity>;

  constructor({
    entity,
    columns,
    values,
    paramBuilder,
    returning,
  }: InsertSqlArgs) {
    this.entity = entity;
    this.columns = columns;
    this.values = values;
    this.paramBuilder = paramBuilder;

    this.returning = returning;
  }

  sql(): Insert {
    let sql = `INSERT INTO ${this.entity.dmlIdentifier.sql()}`;

    sql += ` (${this.columns.map((c) => dQ(c.name)).join(", ")})`;

    sql += ` VALUES ${this.values.map((e) => this.serializeRow(e)).join(", ")}`;

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
        .map((e) => e.sql(this.paramBuilder))
        .join(", ")}`;

      this.targetNode = TargetNodeFactory.createRoot(this.entity.klass, alias);

      targets.forEach((e) => this.targetNode.selectField(e.fieldName!, e.as));
    }

    return {
      sql,
      params: this.paramBuilder.params,
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

    return `$${this.paramBuilder.addParam(value)}`;
  }
}
