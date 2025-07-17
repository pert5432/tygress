import { QueryLogLevel } from "./enums";

export class Logger {
  constructor(private queryLogLevel: QueryLogLevel) {}

  async log(level: QueryLogLevel, sql: string, params?: any[]): Promise<void> {
    switch (level) {
      case QueryLogLevel.ALL:
        return this.logQuery(sql, params);
      case QueryLogLevel.DML:
        return this.logDML(sql, params);
      case QueryLogLevel.DDL:
        return this.logDDL(sql, params);
    }
  }

  async logQuery(sql: string, params?: any[]): Promise<void> {
    if (this.queryLogLevel > QueryLogLevel.ALL) {
      return;
    }

    console.log("Query:");
    console.log(sql);
    if (params) {
      console.log(params ?? []);
    }
  }

  async logDML(sql: string, params?: any[]): Promise<void> {
    if (this.queryLogLevel > QueryLogLevel.DML) {
      return;
    }

    console.log("DML:");
    console.log(sql);
    if (params) {
      console.log(params ?? []);
    }
  }

  async logDDL(sql: string, params?: any[]): Promise<void> {
    if (this.queryLogLevel > QueryLogLevel.DDL) {
      return;
    }

    console.log("DDL:");
    console.log(sql);
    if (params) {
      console.log(params ?? []);
    }
  }

  async logQueryError(
    error: Error,
    sql: string,
    params?: any[]
  ): Promise<void> {
    if (this.queryLogLevel > QueryLogLevel.ERRORS) {
      return;
    }

    console.log("Query error:");
    console.log(sql);
    if (params) {
      console.log(params ?? []);
    }
    console.log(error);
  }
}
