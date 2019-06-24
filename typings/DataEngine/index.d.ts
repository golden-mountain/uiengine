export interface IResponse {}

export interface IDataMapper {
  schema: IDataSchema;
  errorInfo?: any;
  source: IDataSourceInfo;
  schema?: IDataSchema;
  rootSchema?: IDataSchema;
  loadSchema(source?: IDataSourceInfo);
  getDataEntryPoint(method: string): string;
}

export interface IDataEngine {
  errorInfo?: any;
  source: IDataSourceInfo;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager;

  loadData(source?: IDataSourceInfo);
  updateData(source: IDataSourceInfo, data: any);
  replaceData(source: IDataSourceInfo, data: any);
  deleteData(source: IDataSourceInfo);
}
