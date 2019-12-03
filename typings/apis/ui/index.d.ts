export interface IApiUI {
  (selector: any, layoutId?: string): any;
  schema: IApiSchema;
  layout: IApiLayout;
  data: IApiData;
  state: IApiState;
}
