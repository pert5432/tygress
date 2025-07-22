import { QueryLogLevel } from "./enums";

export class Logger {
  constructor(private queryLogLevel: QueryLogLevel) {}

  warn(text: string): void {
    this.write(`[WARN] ${text}`);
  }

  info(text: string): void {
    this.write(`[INFO] ${text}`);
  }

  log(level: QueryLogLevel, sql: string, params?: any[]): void {
    switch (level) {
      case QueryLogLevel.ALL:
        return this.logQuery(sql, params);
      case QueryLogLevel.DML:
        return this.logDML(sql, params);
      case QueryLogLevel.DDL:
        return this.logDDL(sql, params);
    }
  }

  logQuery(sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.ALL) {
      return;
    }

    this.write("Query:");
    this.write(sql);
    if (params) {
      this.write(params.toString());
    }
  }

  logDML(sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.DML) {
      return;
    }

    this.write("DML:");
    this.write(sql);
    if (params) {
      this.write(params.toString());
    }
  }

  logDDL(sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.DDL) {
      return;
    }

    this.write("DDL:");
    this.write(sql);
    if (params) {
      this.write(params.toString());
    }
  }

  logQueryError(error: Error, sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.ERRORS) {
      return;
    }

    this.write("Query error:");
    this.write(sql);
    if (params) {
      this.write(params.toString());
    }
    this.write(error.message);
  }

  private write(input: string): void {
    process.stdout.write(input);
    process.stdout.write("\n");
  }
}
