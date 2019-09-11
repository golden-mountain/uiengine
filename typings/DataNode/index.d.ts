import { AxiosPromise } from "axios";
import { IDataPool } from "../DataPool";
import { IWorkingMode } from "../Workflow";
import { IErrorInfo } from "../Request";
import { IPluginManager } from '../PluginManager'

export interface IDataSchema {
  endpoint: {};
  definition: {};
}

export interface IDataSource {
  source: string;
  schema?: string; // data schema sometimes not same as source
  defaultValue?: any;
  autoload?: boolean;
  loadOptions?: object;
}

export interface ICache {
  [name: string]: {};
}

export interface IDataConnector {
  from?: string;
  to: string;
}

export interface IDataNode {
  id: string
  errorInfo?: IErrorInfo;
  pluginManager: IPluginManager;
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: IDataSource;
  schema?: any;
  rootSchema?: any;
  data: any;
  updatingData?: any;
  dataPool: IDataPool;

  loadData(
    source?: IDataSource | string,
    workingMode?: IWorkingMode
  ): Promise<AxiosPromise> | any;
  updateData(value: any, path?: string);
  deleteData(path?: any);
  getData(path?: string);
  getSchema(path?: string);
  createRow(value?: any, insertHead?: boolean);
}
