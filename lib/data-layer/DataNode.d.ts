import { IDataNode, IRequest, IPluginManager, IUINode, IDataEngine, IDataPool, IDataSource, IWorkingMode, IErrorInfo } from "../../typings";
export default class DataNode implements IDataNode {
    private request;
    pluginManager: IPluginManager;
    dataEngine: IDataEngine;
    uiNode: IUINode;
    source: IDataSource;
    schema?: any;
    rootSchema?: any;
    dataPool: IDataPool;
    constructor(source: IDataSource | string, uiNode: IUINode, request?: IRequest);
    data: any;
    errorInfo: IErrorInfo;
    setDataSource(source: IDataSource | string): IDataSource;
    getData(path?: string): any;
    getSchema(path?: string): any;
    getRootSchema(): any;
    getPluginManager(): IPluginManager;
    loadData(source?: IDataSource | string, workingMode?: IWorkingMode): Promise<any>;
    updateData(value: any, path?: string): Promise<number | true>;
    deleteData(path?: any): Promise<number | true>;
}
