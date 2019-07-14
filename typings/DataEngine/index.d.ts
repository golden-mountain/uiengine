import { IRequest } from "../Request";
import { IDataSource } from "../DataNode";

export interface IResponse {}
export interface IRequestOptions {
  endpoint?: string;
  params?: any;
  method?: string;
}

export interface IDataMapper {
  schema?: IDataSchema;
  errorInfo?: any;
  source?: IDataSource;
  schema?: IDataSchema;
  rootSchema?: IDataSchema;
  cacheID: string;

  setRequest(request: IRequest);
  loadSchema(source?: IDataSource);
  getSchema(source: IDataSource);
  getDataEntryPoint(method: string): string;
}

export interface IDataEngine {
  errorInfo?: any;
  source?: IDataSource;
  mapper: IDataMapper;
  request: IRequest;
  data?: any;
  pluginManager: IPluginManager;
  cacheID: string;
  requestOptions: IRequestOptions;

  setRequest(req: IRequest);
  sendRequest(
    source: IDataSource,
    data: any,
    method: string = "post",
    cache: boolean = false
  );
  loadSchema(source?: IDataSource);
  loadData(source?: IDataSource, data?: any);
  updateData(source?: IDataSource, data?: any);
  replaceData(source?: IDataSource, data?: any);
  deleteData(source?: IDataSource, data?: any);
  // parseSchemaPath(source: string);
}
