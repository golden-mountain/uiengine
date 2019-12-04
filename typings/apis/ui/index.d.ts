export interface IApiUI {
  (selector: any, layoutId?: string, operation?: any): any
  schema: IApiSchema
  layout: IApiLayout
  uiNode: IApiUiNode
  data: IApiData
  state: IApiState
  // ui: any
  select: any
}
