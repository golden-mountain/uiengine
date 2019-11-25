export interface IApiUI {
  schema: IApiSchema;
  layout: IApiLayout;
  data: IApiData;
  state: IApiState;
}

declare type IAPIUIConstructor = (selector: any, layoutId?: string) => IApiUI;
