import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TableIdentifierSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { AnEntity } from "../types";
import { TargetNode } from "../types/query";
import { Update, UpdateSqlArgs } from "../types/update";
import { ConstantBuilder } from "./constant-builder";

export class UpdateSqlBuilder {
  private constBuilder: ConstantBuilder;

  private targetNode: TargetNode<AnEntity>;

  constructor(private args: UpdateSqlArgs) {
    this.constBuilder = args.constBuilder;
  }

  sql(): Update {
    const tableIdentifier = TableIdentifierSqlBuilderFactory.createEntity(
      this.args.entity.alias,
      this.args.entity.entityMeta.klass
    );

    let sql = `UPDATE ${tableIdentifier.sql(this.constBuilder)}`;

    sql += ` SET `;

    sql += this.args.values.map(({ column, value }) => {
      const columnIdentifier =
        ColumnIdentifierSqlBuilderFactory.createNaked(column);

      return `${columnIdentifier.sql()} = ${this.serializeValue(value)}`;
    });

    if (this.args.wheres.length) {
      sql += ` WHERE `;

      sql += `${this.args.wheres
        .map((e) => e.sql(this.constBuilder))
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
        .map((e) => e.sql(this.constBuilder))
        .join(", ")}`;

      this.targetNode = TargetNodeFactory.createRoot(
        this.args.entity.entityMeta.klass,
        tableIdentifier.alias
      );

      targets.forEach((e) => this.targetNode.selectField(e.fieldName!, e.as));
    }

    return {
      sql,
      params: this.constBuilder.params,

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

    return this.constBuilder.addConst(value);
  }
}
