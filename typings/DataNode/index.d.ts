import { AxiosPromise } from "axios";

interface IDataSchema {
  endpoint: {};
  definition: {};
}

interface IDataSource {
  [name: string]: {
    data: any;
  };
}

interface IDataSourceInfo {
  name: string;
  schemaPath: string;
}

interface IDataNode {
  loadData(): IDataNode;
  loadSchema(): Promise<AxiosPromise> | any;
  // loadData(): IDataNode;
  // updateData(): IDataNode;
  getData(): IDataNode;
  // deleteNode(): IDataNode;
  // mockData(): IDataNode; //plugin
  getSchema(): IDataSchema | void;
  getSchemaInfo(source: string): IDataSourceInfo;
  loadRemoteData(source: string): Promise<AxiosPromise> | any;
  getDataEntryPoint(method: string = "default"): string;
  // loadPlugins();
}
