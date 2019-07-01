export interface IResponse {}

export interface IDataMapper {
  schema: IDataSchema;
  errorInfo?: any;
  source: string;
  schema?: IDataSchema;
  rootSchema?: IDataSchema;
  loadSchema(source?: string);
  getDataEntryPoint(method: string): string;
}

export interface IDataEngine {
  errorInfo?: any;
  source: string;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager;
  rootName: string;

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
