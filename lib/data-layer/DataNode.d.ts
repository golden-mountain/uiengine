import { IDataNode, IRequest, IPluginManager, IUINode, IDataEngine } from "../../typings";
export default class DataNode implements IDataNode {
    private request;
    errorInfo: any;
    pluginManager: IPluginManager;
    dataEngine: IDataEngine;
    uiNode: IUINode;
    source: string;
    rootData?: any;
    schema?: any;
    rootSchema?: any;
    data: any;
    cacheID: string;
    constructor(source: any, uiNode: IUINode, request?: IRequest);
    formatCacheID(id: any): string;
    getErrorInfo(): any;
    getData(path?: string): any;
    getSchema(path?: string): any;
    getRootSchema(): any;
    getRootData(path?: string): any;
    getPluginManager(): IPluginManager;
    loadData(source?: string): Promise<any>;
    updateData(value: any, path?: string): Promise<any>;
    deleteData(path?: any): Promise<any>;
    submit(dataSources: Array<string>, extra?: any, connectWith?: string): void;
}
