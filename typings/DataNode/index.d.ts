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
  loadData(): Promise<AxiosPromise> | any;
  loadSchema(): Promise<AxiosPromise> | any;
  // updateData(): IDataNode;
  getData(path?: string): Promise<AxiosPromise> | any;
  // mockData(): IDataNode; //plugin
  getSchema(): Promise<AxiosPromise> | any;
  getSchemaInfo(source: string): IDataSourceInfo;
  loadRemoteData(source: string): Promise<AxiosPromise> | any;
  getDataEntryPoint(method: string = "default"): string;
  // loadPlugins();
  getErrorInfo();
  getSource();
  getPluginManager(): IPluginManager;
}
