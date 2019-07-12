import { IMessager, INodeController, INodeProps, ILayoutSchema, IRequestConfig, IErrorInfo, IWorkflow, IUINodeRenderer, IRequest } from "../../typings";
export default class NodeController implements INodeController {
    static instance: INodeController;
    static getInstance: () => NodeController;
    errorInfo: IErrorInfo;
    nodes: Array<IUINodeRenderer>;
    messager: IMessager;
    requestConfig: IRequestConfig;
    activeLayout: string;
    workflow: IWorkflow;
    engineId: string;
    request: IRequest;
    constructor();
    setRequestConfig(requestConfig: IRequestConfig): void;
    /**
     * Load a layout from remote or local
     * @param layout ILayoutSchema|string path of layout or loaded layout
     */
    loadUINode(layout: ILayoutSchema | string, id?: string, options?: any): Promise<any>;
    deleteUINode(id: string): boolean;
    getUINode(id: string, uiNodeOnly?: boolean): any;
    castMessage(nodeSelector: INodeProps, data: any, ids?: [string]): void;
}
