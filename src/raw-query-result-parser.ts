export abstract class RawQueryResultParser {
  public static async parse<T extends { [key: string]: any }>(
    rows: any[]
  ): Promise<T[]> {
    return rows;
  }
}
