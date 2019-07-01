import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";

export interface INodeController {
  errorInfo: IErrorInfo;
  // layouts: object;
  nodes: Array<IUINode>;
  messager: IMessager;
  requestConfig: IRequestConfig;
  activeLayout: string;

  loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    autoLoadLayout: boolean = true
  );
  deleteUINode(id: string);
  getUINode(id: string);
  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]);
}
