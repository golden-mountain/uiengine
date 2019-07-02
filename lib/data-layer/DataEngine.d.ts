import { IDataEngine, IPluginManager, IRequest, IDataMapper } from "../../typings";
export default class UIEngine implements IDataEngine {
    private request;
    errorInfo?: any;
    source?: string;
    schemaPath?: string;
    mapper: IDataMapper;
    data?: any;
    pluginManager: IPluginManager;
    cacheID: string;
    /**
     *
     * @param source a.b.c
     * @param request IRequest
     * @param loadDefaultPlugins whether load default plugins
     */
    constructor(request: IRequest);
    parseSchemaPath(source: string): string;
    loadSchema(source: string): Promise<any>;
    sendRequest(source: string, data?: any, method?: string, cache?: boolean): Promise<any>;
    loadData(source: string, params?: any): Promise<any>;
    updateData(source: string, data?: any): Promise<any>;
    replaceData(source: string, data?: any): Promise<any>;
    deleteData(source: string, data?: any): Promise<any>;
}
