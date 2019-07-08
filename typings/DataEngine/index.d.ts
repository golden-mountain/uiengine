export interface IResponse {}
export interface IRequestOptions {
  endpoint?: string;
  params?: any;
  method?: string;
}

export interface IDataMapper {
  schema?: IDataSchema;
  errorInfo?: any;
  source?: string;
  schema?: IDataSchema;
  rootSchema?: IDataSchema;
  cacheID: string;
  loadSchema(source?: string);
  getDataEntryPoint(method: string): string;
}

export interface IDataEngine {
  errorInfo?: any;
  source?: string;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager;
  cacheID: string;
  requestOptions: IRequestOptions;

  sendRequest(
    source: string,
    data: any,
    method: string = "post",
    cache: boolean = false
  );
  loadSchema(source?: string);
  loadData(source?: string, data?: any);
  updateData(source?: string, data?: any);
  replaceData(source?: string, data?: any);
  deleteData(source?: string, data?: any);
  parseSchemaPath(source: string);
}
