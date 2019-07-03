import { IDataNode, IRequest, IPluginManager, IUINode, IDataEngine, IDataPool } from "../../typings";
export default class DataNode implements IDataNode {
    private request;
    errorInfo: any;
    pluginManager: IPluginManager;
    dataEngine: IDataEngine;
    uiNode: IUINode;
    source: string;
    schema?: any;
    rootSchema?: any;
    data: any;
    dataPool: IDataPool;
    constructor(source: any, uiNode: IUINode, request?: IRequest);
    formatSource(source: string, prefix?: string): string;
    getErrorInfo(): any;
    getData(path?: string): any;
    getSchema(path?: string): any;
    getRootSchema(): any;
    getPluginManager(): IPluginManager;
    loadData(source?: string, schemaOnly?: boolean): Promise<any>;
    updateData(value: any, path?: string): Promise<any>;
    deleteData(path?: any): Promise<any>;
    submit(dataSources: Array<string>, method?: string, connectWith?: string): Promise<any>;
}
