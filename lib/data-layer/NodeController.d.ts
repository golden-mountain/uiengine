import { IUINode, IMessager, INodeController, INodeProps, ILayoutSchema, IRequestConfig, IErrorInfo } from "../../typings";
export default class NodeController implements INodeController {
    static instance: INodeController;
    static getInstance: () => NodeController;
    errorInfo: IErrorInfo;
    nodes: Array<IUINode>;
    messager: IMessager;
    requestConfig: IRequestConfig;
    activeLayout: string;
    setRequestConfig(requestConfig: IRequestConfig): void;
    /**
     * Load a layout from remote or local
     * @param layout ILayoutSchema|string path of layout or loaded layout
     */
    loadUINode(layout: ILayoutSchema | string, id?: string, autoLoadLayout?: boolean, useCache?: boolean): Promise<any>;
    deleteUINode(id: string): boolean;
    getUINode(id: string): any;
    castMessage(nodeSelector: INodeProps, data: any, ids?: [string]): void;
}
