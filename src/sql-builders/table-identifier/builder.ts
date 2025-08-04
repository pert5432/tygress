import { ConstantBuilder } from "../constant-builder";

export abstract class TableIdentifierSqlBuilder {
  abstract sql(constBuilder: ConstantBuilder): string;
}
