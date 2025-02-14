export abstract class LoadingViews {
  protected message:string;
  protected _percentage: number;
  public get percentage(): number {
    return this._percentage;
  }
  public set percentage(value: number) {
    this._percentage = value;
  }
}
