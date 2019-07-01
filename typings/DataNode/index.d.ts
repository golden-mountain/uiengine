import { AxiosPromise } from "axios";

export interface IDataSchema {
  endpoint: {};
  definition: {};
}

export interface ICache {
  [name: string]: {};
}

export interface IDataNode {
  errorInfo: any;
  pluginManager: IPluginManager;
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: string;
  rootData?: any;
  schema?: any;
  rootSchema?: any;
  data: any;
  updatingData?: any;
  loadData(source?: string): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  deleteData(path?: any);
  getData(path?: string);
  getSchema(path?: string);
  getErrorInfo();
  getPluginManager(): IPluginManager;
  getRootSchema();
  getRootData(path?: string);
  submit(dataSources: Array<string>, extra?: any);
}
