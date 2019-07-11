import { IDataEngine, IPluginManager, IRequest, IRequestOptions, IDataMapper } from "../../typings";
export default class DataEngine implements IDataEngine {
    static instance: IDataEngine;
    static getInstance: () => DataEngine;
    request: IRequest;
    errorInfo?: any;
    source?: string;
    schemaPath?: string;
    mapper: IDataMapper;
    data?: any;
    pluginManager: IPluginManager;
    cacheID: string;
    requestOptions: IRequestOptions;
    setRequest(request: IRequest): void;
    loadSchema(source: string): Promise<any>;
    sendRequest(source: string, data?: any, method?: string, cache?: boolean): Promise<any>;
    loadData(source: string, params?: any): Promise<any>;
    updateData(source: string, data?: any): Promise<any>;
    replaceData(source: string, data?: any): Promise<any>;
    deleteData(source: string, data?: any): Promise<any>;
}
