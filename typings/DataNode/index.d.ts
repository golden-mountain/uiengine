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
  schema?: any;
  data: any;
  // private rootSchema?: any;
  updatingData?: any;
  loadData(): Promise<AxiosPromise> | any;
  loadSchema(): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  getData(path?: string): Promise<AxiosPromise> | any;
  getSchema(): Promise<AxiosPromise> | any;
  getSchemaInfo(source: string): IDataSourceInfo;
  loadRemoteData(source: string): Promise<AxiosPromise> | any;
  getDataEntryPoint(method: string = "default"): string;
  getErrorInfo();
  getSource();
  getPluginManager(): IPluginManager;
}
