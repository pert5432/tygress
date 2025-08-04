export class DropIndexSqlBuilder {
  constructor(private name: string) {}

  sql(): string {
    return `DROP INDEX ${this.name}`;
  }
}
