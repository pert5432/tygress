import { dQ } from "../../utils";
import { ConstantBuilder } from "../constant-builder";
import { TableIdentifierSqlBuilder } from "./builder";

export class TablenameTableIdentifierSqlBuilder extends TableIdentifierSqlBuilder {
  tablename: string;
  alias: string;

  override sql(_constBuilder: ConstantBuilder): string {
    return `${dQ(this.tablename)} ${dQ(this.alias)}`;
  }
}
