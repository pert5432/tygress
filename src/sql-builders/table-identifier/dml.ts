import { dQ } from "../../utils";
import { TableIdentifierSqlBuilder } from "./builder";

export class DmlTableIdentifierSqlBuilder extends TableIdentifierSqlBuilder {
  tablename: string;

  override sql(): string {
    return dQ(this.tablename);
  }
}
