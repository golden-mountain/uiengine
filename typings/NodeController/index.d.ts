import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";
import { IWorkflow, ILoadOptions } from "../Workflow";

export interface IUINodeRenderer {
  uiNode: IUINode;
  options?: ILoadOptions;
  visible?: boolean;
}

export interface INodeController {
  errorInfo: IErrorInfo;
  // layouts: object;
  nodes: any;
  workflow: IWorkflow;
  messager: IMessager;
  requestConfig: IRequestConfig;
  activeLayout: string;
  layouts: Array<string>; // layout stack
  engineId: string;

  loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    options?: ILoadOptions
  );
  deleteUINode(layout: string);
  hideUINode(layout: string);
  getUINode(layout: string, uiNodeOnly: boolean = false);
  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]);
  setRequestConfig(requestConfig: IRequestConfig);
  pushLayout(layout: string);
}
