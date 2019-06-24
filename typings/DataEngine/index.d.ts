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

  loadData(source?: string);
  updateData(source: string, data: any);
  replaceData(source: string, data: any);
  deleteData(source: string);
  parseSchemaPath(source: string);
}
