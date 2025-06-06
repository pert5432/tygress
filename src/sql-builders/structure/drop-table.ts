export class DropTableSqlBuilder {
  constructor(private tablename: string) {}

  sql(): string {
    return `DROP TABLE ${this.tablename}`;
  }
}
