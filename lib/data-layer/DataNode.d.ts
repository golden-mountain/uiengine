import { IDataNode, IRequest, IPluginManager, IUINode, IDataEngine, IDataPool, IDataSource, IWorkingMode } from "../../typings";
export default class DataNode implements IDataNode {
    private request;
    errorInfo: any;
    pluginManager: IPluginManager;
    dataEngine: IDataEngine;
    uiNode: IUINode;
    source: IDataSource;
    schema?: any;
    rootSchema?: any;
    data: any;
    dataPool: IDataPool;
    constructor(source: IDataSource | string, uiNode: IUINode, request?: IRequest);
    setDataSource(source: IDataSource | string): IDataSource;
    getErrorInfo(): any;
    getData(path?: string): any;
    getSchema(path?: string): any;
    getRootSchema(): any;
    getPluginManager(): IPluginManager;
    loadData(source?: IDataSource | string, workingMode?: IWorkingMode): Promise<any>;
    updateData(value: any, path?: string): Promise<any>;
    deleteData(path?: any): Promise<any>;
}
