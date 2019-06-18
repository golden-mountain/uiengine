import { AxiosPromise } from "axios";

interface IDataSchema {
  endpoint: {};
  definition: {};
}

interface ICache {
  [name: string]: {};
}

interface IDataSourceInfo {
  name?: string;
  schemaPath?: string;
}

interface IDataNode {
  loadData(): Promise<AxiosPromise> | any;
  loadSchema(): Promise<AxiosPromise> | any;
  // updateData(): IDataNode;
  getData(): Promise<AxiosPromise> | any;
  // mockData(): IDataNode; //plugin
  getSchema(): Promise<AxiosPromise> | any;
  getSchemaInfo(source: string): IDataSourceInfo;
  loadRemoteData(source: string): Promise<AxiosPromise> | any;
  getDataEntryPoint(method: string = "default"): string;
  // loadPlugins();
  getErrorInfo();
  getSource();
}
