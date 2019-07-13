import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";
import { IWorkflow } from "../Workflow";

export interface IRenderOptions {
  component: string;
  [name]?: any;
}

export interface IUINodeRenderer {
  uiNode: IUINode;
  options: IRenderOptions;
}

export interface INodeController {
  errorInfo: IErrorInfo;
  // layouts: object;
  nodes: Array<IUINodeRenderer>;
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
  deleteUINode(id: string);
  getUINode(id: string, uiNodeOnly: boolean = false);
  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]);
  setRequestConfig(requestConfig: IRequestConfig);
  pushLayout(layout: string);
}
