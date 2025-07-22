import { QueryLogLevel } from "./enums";
import { STYLE } from "./utils";

export class Logger {
  constructor(
    private queryLogLevel: QueryLogLevel,
    private colors: boolean = true
  ) {}

  warn(text: string): void {
    this.write(`${this.red(this.bold(`[WARN]`))} ${text}`);
  }

  info(text: string): void {
    this.write(`${this.cyan(this.bold(`[INFO]`))} ${text}`);
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

    this.write(this.cyan(this.bold("Query:")));
    this.write(sql);
    if (params) {
      this.write(this.formatParams(params));
    }
  }

  logDML(sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.DML) {
      return;
    }

    this.write(this.yellow(this.bold("DML:")));
    this.write(sql);
    if (params) {
      this.write(this.formatParams(params));
    }
  }

  logDDL(sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.DDL) {
      return;
    }

    this.write(this.magenta(this.bold("DDL:")));
    this.write(sql);
    if (params) {
      this.write(this.formatParams(params));
    }
  }

  logQueryError(error: Error, sql: string, params?: any[]): void {
    if (this.queryLogLevel > QueryLogLevel.ERRORS) {
      return;
    }

    this.write(this.red(this.bold("Query error:")));
    this.write(sql);
    if (params) {
      this.write(this.formatParams(params));
    }
    this.write(error.message);
  }

  private write(input: string): void {
    process.stdout.write(input);
    process.stdout.write("\n");
  }

  //
  // Colors
  //

  private bold(input: string): string {
    return this.style(input, "bold");
  }

  private red(input: string): string {
    return this.style(input, "red");
  }

  private green(input: string): string {
    return this.style(input, "green");
  }

  private yellow(input: string): string {
    return this.style(input, "yellow");
  }

  private magenta(input: string): string {
    return this.style(input, "magenta");
  }

  private cyan(input: string): string {
    return this.style(input, "cyan");
  }

  private white(input: string): string {
    return this.style(input, "white");
  }

  private style(input: string, styleName: keyof typeof STYLE): string {
    if (!this.colors) {
      return input;
    }

    const style = STYLE[styleName];

    return `\u001B[${style[0]}m${input}\u001B[${style[1]}m`;
  }

  private formatParams(params: any[]): string {
    return params.map((e) => this.green(e.toString())).join(", ");
  }
}
