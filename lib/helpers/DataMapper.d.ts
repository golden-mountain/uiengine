import { IDataMapper, IDataSchema, IRequest, IErrorInfo, IPluginManager } from "../../typings";
export default class DataMapper implements IDataMapper {
    static instance: IDataMapper;
    static getInstance: () => DataMapper;
    request: IRequest;
    errorInfo?: IErrorInfo;
    source: string;
    rootSchema?: IDataSchema;
    pluginManager: IPluginManager;
    cacheID: string;
    setRequest(request: IRequest): void;
    getDataEntryPoint(method: string): string;
    getSchema(source: string): Promise<any>;
    loadSchema(source: string): Promise<any>;
}
