import { AxiosPromise } from "axios";
import { IDataNode, IStateNode, IUINode, ILayoutSchema, IRequest, IErrorInfo, IPluginManager, IMessager, IStateInfo, IWorkingMode, IUINodeRenderer } from "../../typings";
export default class UINode implements IUINode {
    request: IRequest;
    dataNode: IDataNode;
    stateNode: IStateNode;
    children: Array<UINode>;
    pluginManager: IPluginManager;
    errorInfo: IErrorInfo;
    schema: ILayoutSchema;
    rootName: string;
    isLiveChildren: boolean;
    id: string;
    messager: IMessager;
    props: object;
    parent?: IUINode;
    stateInfo: IStateInfo;
    workingMode?: IWorkingMode;
    nodes: {
        [name: string]: IUINodeRenderer;
    };
    constructor(schema: ILayoutSchema, request?: IRequest, root?: string, parent?: IUINode);
    private setRootName;
    loadLayout(schema?: ILayoutSchema | string, workingMode?: IWorkingMode): Promise<any>;
    getSchema(path?: string): ILayoutSchema;
    loadRemoteLayout(url: string): Promise<AxiosPromise>;
    /**
     * TO DO: need to enhance:
     * 1. if only state change, on layout gen
     * 2. if data change, if the changed data has an item different than origin one, should renew the one, if delete one, should also remove the one
     * @param schema
     * @param reloadData
     */
    private assignSchema;
    replaceLayout(newSchema: ILayoutSchema | string, workingMode?: IWorkingMode): Promise<any>;
    updateLayout(workingMode?: IWorkingMode): Promise<this>;
    clearLayout(): this;
    getNode(path?: string): any;
    getChildren(route?: Array<Number>): any;
    genLiveLayout(schema: ILayoutSchema, data: any): Promise<ILayoutSchema>;
    sendMessage(force?: boolean): void;
}
