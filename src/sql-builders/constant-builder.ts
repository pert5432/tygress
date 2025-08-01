export abstract class ConstantBuilder {
  /**
   * Returns params that should be sent alongside the SQL statement
   */
  public abstract get params(): any[];

  /**
   * Returns the provided value in the way it should appear in the SQL statement
   *
   * @param val value to be sent to SQL
   */
  public abstract addConst(val: any): string;
}

/**
 * Returns param placeholders $1, $2, $3...
 * `params` returns the consts provided in `addConst` in the order they were provided in
 */
export class ParametrizedConstantBuilder extends ConstantBuilder {
  private _params: any[] = [];

  public get params(): any[] {
    return this._params;
  }

  public addConst(val: any): string {
    this._params.push(val);

    return `$${this._params.length}`;
  }
}
