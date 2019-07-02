import { AxiosPromise } from "axios";
import { IDataPool } from "../DataPool";

export interface IDataSchema {
  endpoint: {};
  definition: {};
}

export interface ICache {
  [name: string]: {};
}

export interface IDataConnector {
  from?: string;
  to: string;
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
  dataPool: IDataPool;

  loadData(source?: string): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  deleteData(path?: any);
  getData(path?: string);
  getSchema(path?: string);
  getErrorInfo();
  getPluginManager(): IPluginManager;
  getRootSchema();
  getRootData(path?: string);
  submit(dataSources: Array<string>, method: string, connectWith?: string);
}
