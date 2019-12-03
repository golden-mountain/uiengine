export interface IApiEngine {
  register: IApiRegister;
  config: IApiConfig;
  request: IApiRequest;
  plugin: IApiPlugin;

  ui: IApiUI;
  data: IApiData;
  state: IApiState;

  // add more clearly
  [name: string]: any;
}
