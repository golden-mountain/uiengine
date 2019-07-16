import { IDataEngine, IPluginManager, IRequest, IRequestOptions, IDataMapper, IDataSource } from "../../typings";
export default class DataEngine implements IDataEngine {
    static instance: IDataEngine;
    static getInstance: () => DataEngine;
    request: IRequest;
    errorInfo?: any;
    source?: IDataSource;
    schemaPath?: string;
    mapper: IDataMapper;
    data?: any;
    pluginManager: IPluginManager;
    cacheID: string;
    requestOptions: IRequestOptions;
    setRequest(request: IRequest): void;
    loadSchema(source: IDataSource): Promise<any>;
    sendRequest(source: IDataSource, data?: any, method?: string, cache?: boolean): Promise<any>;
    loadData(source: IDataSource, params?: any): Promise<any>;
    updateData(source: IDataSource, data?: any): Promise<any>;
    replaceData(source: IDataSource, data?: any): Promise<any>;
    deleteData(source: IDataSource, data?: any): Promise<any>;
}
