import { IDataEngine, IPluginManager, IRequest, IDataMapper } from "../../typings";
export default class UIEngine implements IDataEngine {
    private request;
    errorInfo?: any;
    source: string;
    schemaPath: string;
    mapper: IDataMapper;
    data?: any;
    pluginManager: IPluginManager;
    /**
     *
     * @param source a.b.c
     * @param request IRequest
     * @param loadDefaultPlugins whether load default plugins
     */
    constructor(source: string, request: IRequest, loadDefaultPlugins?: boolean);
    parseSchemaPath(source: string): string;
    loadSchema(source?: string): Promise<any>;
    sendRequest(source?: string, data?: any, method?: string, cache?: boolean): Promise<{}>;
    loadData(source?: string, params?: any): Promise<{}>;
    updateData(source?: string, data?: any): Promise<{}>;
    replaceData(source?: string, data?: any): Promise<{}>;
    deleteData(source?: string, data?: any): Promise<{}>;
}
