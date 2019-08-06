import { IUINode, IMessager, INodeController, INodeProps, ILayoutSchema, IRequestConfig, IErrorInfo, IWorkflow, IUINodeRenderer, IRequest, ILoadOptions, IPluginManager, IWorkingMode } from "../../typings";
export default class NodeController implements INodeController {
    static instance: INodeController;
    static getInstance: () => NodeController;
    pluginManager: IPluginManager;
    errorInfo: IErrorInfo;
    nodes: {
        [name: string]: IUINodeRenderer;
    };
    messager: IMessager;
    requestConfig: IRequestConfig;
    activeLayout: string;
    layouts: Array<string>;
    workflow: IWorkflow;
    engineId: string;
    request: IRequest;
    constructor();
    activeEngine(engineId: string): void;
    setRequestConfig(requestConfig: IRequestConfig): void;
    /**
     * Load a layout from remote or local
     * @param layout ILayoutSchema|string path of layout or loaded layout
     */
    loadUINode(layout: ILayoutSchema | string, id?: string, options?: ILoadOptions, updateNodes?: boolean): Promise<IUINode>;
    deleteUINode(layout: string): boolean;
    hideUINode(layout: string): void;
    getUINode(layout: string, uiNodeOnly?: boolean): IUINode | IUINodeRenderer;
    castMessage(nodeSelector: INodeProps, data: any, ids?: [string]): void;
    pushLayout(layout: string): void;
    setWorkingMode(layout: string, workingMode: IWorkingMode): void;
    getWorkingMode(layout?: string): IWorkingMode | undefined;
}
