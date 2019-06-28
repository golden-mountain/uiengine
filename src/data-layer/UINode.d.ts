import { AxiosPromise } from "axios";
import { IDataNode, IStateNode, IUINode, ILayoutSchema, IRequest, IErrorInfo, IPluginManager, IMessager } from "../../typings";
export default class UINode implements IUINode {
    private request;
    dataNode?: any;
    stateNode: IStateNode;
    children: Array<UINode>;
    pluginManager: IPluginManager;
    loadDefaultPlugins: boolean;
    errorInfo: IErrorInfo;
    schema: ILayoutSchema;
    rootName: string;
    isLiveChildren: boolean;
    id: string;
    messager: IMessager;
    props: object;
    parent?: IUINode;
    constructor(schema: ILayoutSchema, request?: IRequest, root?: string, loadDefaultPlugins?: boolean, parent?: IUINode);
    loadLayout(schema?: ILayoutSchema | string): Promise<any>;
    getSchema(path?: string): ILayoutSchema;
    getErrorInfo(): IErrorInfo;
    getDataNode(): IDataNode;
    getStateNode(): IStateNode;
    getPluginManager(): IPluginManager;
    getRequest(): IRequest;
    loadRemoteLayout(url: string): Promise<AxiosPromise>;
    /**
     * TO DO: need to enhance:
     * 1. if only state change, on layout gen
     * 2. if data change, if the changed data has an item different than origin one, should renew the one, if delete one, should also remove the one
     * @param schema
     * @param reloadData
     */
    private assignSchema;
    loadData(source: string): Promise<any>;
    replaceLayout(newSchema: ILayoutSchema | string): Promise<any>;
    updateLayout(): Promise<this>;
    clearLayout(): this;
    getNode(path?: string): any;
    getChildren(route?: Array<Number>): any;
    searchNodes(prop: object, layoutId?: string): any;
    searchDepsNodes(myNode?: IUINode, layoutId?: string): any[];
    genLiveLayout(schema: ILayoutSchema, data: any): Promise<ILayoutSchema>;
    updateState(): Promise<any>;
}
