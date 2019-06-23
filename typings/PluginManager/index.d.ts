export type IPluginFunc = (this: any, ...args: any) => any;

export interface IPlugins {
  // [type: string]: {
  //   [string]: IPlugin;
  // };
}

export interface IPlugin {
  type: string;
  initialize: boolean;
  callback: IPluginFunc;
  name: string;
}

export interface IPluginManager {
  result: object;
  errorInfo: IErrorInfo;
  getPlugins(type?: string, name?: string);
  loadPlugins(plugins: IPlugins): IPlugins;
  //unloadPlugins(type: string, name?: string);
  executePlugins(type: string);
  setErrorInfo(type: string, name: string, key: string, value: any): IErrorInfo;
}
