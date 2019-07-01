import { IUINode, IMessager, INodeController, INodeProps, ILayoutSchema, IRequestConfig, IErrorInfo } from "../../typings";
import { UINode } from ".";
export default class NodeController implements INodeController {
    errorInfo: IErrorInfo;
    nodes: Array<IUINode>;
    messager: IMessager;
    requestConfig: IRequestConfig;
    activeLayout: string;
    constructor(requestConfig: any);
    /**
     * Load a layout from remote or local
     * @param layout ILayoutSchema|string path of layout or loaded layout
     */
    loadUINode(layout: ILayoutSchema | string, id?: string, autoLoadLayout?: boolean): Promise<UINode>;
    deleteUINode(id: string): boolean;
    getUINode(id: string): any;
    castMessage(nodeSelector: INodeProps, data: any, ids?: [string]): void;
}
