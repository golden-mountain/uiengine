import { AxiosPromise } from "axios";

interface IDataSchema {}

interface IDataSource {
  isURL?: boolean;
  value: any;
}

interface IDataNode {
  loadData(source: string): Promise<AxiosPromise>;
  // loadData(): IDataNode;
  // updateData(): IDataNode;
  getData(): any;
  // deleteNode(): IDataNode;
  // mockData(): IDataNode; //plugin
  // setDataSchema(): IDataSchema;
  // getDataSchema(): IDataSchema;
  // loadPlugins();
}
