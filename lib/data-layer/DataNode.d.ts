import { IDataNode, IRequest, IPluginManager, IUINode, IDataEngine, IDataPool, IDataSource, IErrorInfo } from "../../typings";
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
    private refreshLayout;
    data: any;
    errorInfo: IErrorInfo;
    setDataSource(source: IDataSource | string): IDataSource;
    getData(path?: string): any;
    getSchema(path?: string): any;
    loadData(source?: IDataSource | string): Promise<any>;
    updateData(value: any, path?: string): Promise<number | true>;
    createRow(value?: any, insertHead?: boolean): Promise<any>;
    deleteData(path?: any): Promise<number | true>;
}
