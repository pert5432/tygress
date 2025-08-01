export abstract class ConstantBuilder {
  public abstract get params(): any[];

  public abstract addConst(val: any): string;
}

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
