import {
  ColumnMetadata,
  METADATA_STORE,
  RelationMetadata,
  TableMetadata,
} from "../../metadata";
import { ReferentialAction } from "../../types/structure";
import { pad } from "../../utils";
import { ColumnStructureSqlBuilder } from "./column";
import { StructureSqlBuilderUtils } from "./utils";

export class AlterTableSqlBuilder {
  private actions: string[] = [];

  constructor(private table: TableMetadata) {}

  hasChanges(): boolean {
    return !!this.actions.length;
  }

  sql(): string {
    return `ALTER TABLE ${this.table.tablename}\n${pad(
      1,
      this.actions.join(",\n")
    )};`;
  }

  addColumn(column: ColumnMetadata): void {
    this.do(`ADD COLUMN ${new ColumnStructureSqlBuilder(column).sql()}`);
  }

  dropColumn(columnName: string): void {
    this.do(`DROP COLUMN ${columnName}`);
  }

  setDataType(column: ColumnMetadata): void {
    this.do(
      `ALTER COLUMN ${
        column.name
      } SET DATA TYPE ${StructureSqlBuilderUtils.dataType(column)}`
    );
  }

  setDefault(column: ColumnMetadata): void {
    if (!column.default) {
      throw new Error(`Column ${column.name} does not have a default value`);
    }

    this.do(
      `ALTER COLUMN ${
        column.name
      } SET DEFAULT ${StructureSqlBuilderUtils.defaultValue(column)}`
    );
  }

  dropDefault(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} DROP DEFAULT`);
  }

  setNotNull(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} SET NOT NULL`);
  }

  dropNotNull(column: ColumnMetadata): void {
    this.do(`ALTER COLUMN ${column.name} DROP NOT NULL`);
  }

  addFK(
    relation: RelationMetadata,
    name: string,
    actions?: { onDelete?: ReferentialAction; onUpdate?: ReferentialAction }
  ): void {
    if (this.table.klass !== relation.foreign) {
      throw new Error(
        `You should add an FK for this relation on the foreign table of the relation`
      );
    }

    const primaryMeta = METADATA_STORE.getTable(relation.primary);

    // ADD CONSTRAINT "campaign_email_customers_campaign_email_id_fkey" FOREIGN KEY ("campaign_email_id") REFERENCES "campaign_emails"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    this.do(
      `ADD CONSTRAINT "${name}" FOREIGN KEY ("${
        relation.foreignColumn.name
      }") REFERENCES "${primaryMeta.tablename}" ("${
        relation.primaryColumn.name
      }") ON DELETE ${actions?.onDelete ?? relation.onDelete} ON UPDATE ${
        actions?.onUpdate ?? relation.onUpdate
      }`
    );
  }

  dropFK(name: string): void {
    this.do(`DROP CONSTRAINT "${name}"`);
  }

  //
  // PRIVATE
  //

  private do(statement: string): void {
    this.actions.push(statement);
  }
}
