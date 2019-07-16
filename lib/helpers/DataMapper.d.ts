import { IDataMapper, IDataSchema, IRequest, IErrorInfo, IPluginManager, IDataSource } from "../../typings";
export default class DataMapper implements IDataMapper {
    static instance: IDataMapper;
    static getInstance: () => DataMapper;
    request: IRequest;
    errorInfo?: IErrorInfo;
    source: IDataSource;
    rootSchema?: IDataSchema;
    pluginManager: IPluginManager;
    cacheID: string;
    setRequest(request: IRequest): void;
    getDataEntryPoint(method: string): string;
    getSchema(source: IDataSource): Promise<any>;
    loadSchema(source: IDataSource): Promise<any>;
}
