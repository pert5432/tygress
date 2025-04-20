import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TableIdentifierSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { AnEntity } from "../types";
import { Delete, DeleteSqlArgs } from "../types/delete";
import { TargetNode } from "../types/query";
import { entityNameToAlias } from "../utils";
import { ParamBuilder } from "./param-builder";

export class DeleteSqlBuilder {
  private paramBuilder: ParamBuilder;

  private targetNode: TargetNode<AnEntity>;

  constructor(private args: DeleteSqlArgs) {
    this.paramBuilder = args.paramBuilder;
  }

  sql(): Delete {
    const tableIdentifier = TableIdentifierSqlBuilderFactory.createEntity(
      this.args.entity.alias,
      this.args.entity.entityMeta.klass
    );

    let sql = `DELETE FROM ${tableIdentifier.sql(this.paramBuilder)}`;

    if (this.args.wheres.length) {
      sql += ` WHERE `;

      sql += `${this.args.wheres
        .map((e) => e.sql(this.paramBuilder))
        .join(" AND ")}`;
    }

    if (this.args.returning.length) {
      const alias = entityNameToAlias(this.args.entity.entityMeta.klass.name);
      const targets = this.args.returning.map((c) =>
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

      this.targetNode = TargetNodeFactory.createRoot(
        this.args.entity.entityMeta.klass,
        alias
      );

      targets.forEach((e) => this.targetNode.selectField(e.fieldName!, e.as));
    }

    return {
      sql,
      params: this.paramBuilder.params,

      targetNode: this.targetNode,
    };
  }
}
