import { dQ } from "../../utils";
import { ParamBuilder } from "../param-builder";
import { TableIdentifierSqlBuilder } from "./builder";

export class TablenameTableIdentifierSqlBuilder extends TableIdentifierSqlBuilder {
  tablename: string;
  alias: string;

  override sql(_paramBuilder: ParamBuilder): string {
    return `${dQ(this.tablename)} ${dQ(this.alias)}`;
  }
}
