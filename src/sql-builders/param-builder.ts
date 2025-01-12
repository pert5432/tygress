export class ParamBuilder {
  private _params: any[] = [];

  public get params(): any[] {
    return this._params;
  }

  public addParam(val: any): number {
    this._params.push(val);

    return this._params.length;
  }
}
