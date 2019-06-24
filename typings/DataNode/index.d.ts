import { AxiosPromise } from "axios";

export interface IDataSchema {
  endpoint: {};
  definition: {};
}

export interface ICache {
  [name: string]: {};
}

export interface IDataSourceInfo {
  name?: string;
  schemaPath?: string;
}

export interface IDataNode {
  errorInfo: any;
  pluginManager: IPluginManager;
  uiNode: IUINode;
  source: IDataSourceInfo;
  rootData?: any;
  schema?: any;
  rootSchema?: any;
  data: any;
  updatingData?: any;
  loadData(): Promise<AxiosPromise> | any;
  loadSchema(): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  deleteData(path?: any);
  getData(path?: string): Promise<AxiosPromise> | any;
  getSchema(): Promise<AxiosPromise> | any;
  getSchemaInfo(source: string): IDataSourceInfo;
  loadRemoteData(source: string): Promise<AxiosPromise> | any;
  getDataEntryPoint(method: string = "default"): string;
  getErrorInfo();
  getSource();
  getPluginManager(): IPluginManager;
  getRootSchema();
  getRootData();
}
