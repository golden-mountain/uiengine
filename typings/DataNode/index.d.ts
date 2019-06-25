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
  loadData(): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  deleteData(path?: any);
  getData(path?: string): Promise<AxiosPromise> | any;
  getSchema(): Promise<AxiosPromise> | any;
  getErrorInfo();
  getPluginManager(): IPluginManager;
  getRootSchema();
  getRootData();
}
