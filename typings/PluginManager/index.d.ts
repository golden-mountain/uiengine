export type IPluginFunc = (this: any, ...args: any) => any;

export interface IPlugins {
  // [type: string]: {
  //   [string]: IPlugin;
  // };
}

export interface IPlugin {
  type: string;
  weight: number;
  callback: IPluginFunc;
  name: string;
}

// how to execute the plugins
export interface IPluginExecutionConfig {
  stopWhenEmpty?: boolean;
  returnLastValue?: boolean;
  executeOnlyPluginName?: string;
  async?: boolean;
}

export interface IPluginManager {
  result: object;
  errorInfo: IErrorInfo;
  getPlugins(type?: string, name?: string);
  loadPlugins(plugins: IPlugins): IPlugins;
  //unloadPlugins(type: string, name?: string);
  executePlugins(type: string, stopWhenEqual?: IPluginExecutionConfig);
  executeSyncPlugins(type: string, stopWhenEqual?: IPluginExecutionConfig);
  executePlugin(plugin: IPlugin);
  setErrorInfo(type: string, name: string, key: string, value: any): IErrorInfo;
}
