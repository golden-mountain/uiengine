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
    updatingData?: any;
    constructor(source: any, uiNode: IUINode, request?: IRequest);
    getErrorInfo(): any;
    getData(path?: string): any;
    getSchema(path?: string): any;
    getRootSchema(): any;
    getRootData(path?: string): any;
    getPluginManager(): IPluginManager;
    loadData(source?: string): Promise<any>;
    updateData(value: any, path?: string): Promise<boolean>;
    deleteData(path?: any): Promise<void>;
}
