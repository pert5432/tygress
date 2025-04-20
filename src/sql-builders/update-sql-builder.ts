import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TableIdentifierSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { AnEntity } from "../types";
import { TargetNode } from "../types/query";
import { Update, UpdateSqlArgs } from "../types/update";
import { ParamBuilder } from "./param-builder";

export class UpdateSqlBuilder {
  private paramBuilder: ParamBuilder;

  private targetNode: TargetNode<AnEntity>;

  constructor(private args: UpdateSqlArgs) {
    this.paramBuilder = args.paramBuilder;
  }

  sql(): Update {
    const tableIdentifier = TableIdentifierSqlBuilderFactory.createEntity(
      this.args.entity.alias,
      this.args.entity.entityMeta.klass
    );

    let sql = `UPDATE ${tableIdentifier.sql(this.paramBuilder)}`;

    sql += ` SET `;

    sql += this.args.values.map(({ column, value }) => {
      const columnIdentifier =
        ColumnIdentifierSqlBuilderFactory.createNaked(column);

      return `${columnIdentifier.sql()} = ${this.serializeValue(value)}`;
    });

    if (this.args.wheres.length) {
      sql += ` WHERE `;

      sql += `${this.args.wheres
        .map((e) => e.sql(this.paramBuilder))
        .join(" AND ")}`;
    }

    if (this.args.returning.length) {
      const targets = this.args.returning.map((c) =>
        SelectTargetSqlBuilderFactory.createColumnIdentifier(
          ColumnIdentifierSqlBuilderFactory.createNaked(c),
          `${tableIdentifier.alias}.${c.fieldName}`,
          tableIdentifier.alias,
          c.fieldName
        )
      );

      sql += ` RETURNING ${targets
        .map((e) => e.sql(this.paramBuilder))
        .join(", ")}`;

      this.targetNode = TargetNodeFactory.createRoot(
        this.args.entity.entityMeta.klass,
        tableIdentifier.alias
      );

      targets.forEach((e) => this.targetNode.selectField(e.fieldName!, e.as));
    }

    return {
      sql,
      params: this.paramBuilder.params,

      targetNode: this.targetNode,
    };
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
