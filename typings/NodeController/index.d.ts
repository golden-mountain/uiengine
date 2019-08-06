import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";
import { IWorkflow, ILoadOptions, IWorkingMode } from "../Workflow";

export interface IUINodeRenderer {
  uiNode: IUINode;
  engineId: string; // React Component ID
  options?: ILoadOptions;
  visible?: boolean;
  workingMode?: IWorkingMode;
}

export interface INodeController {
  pluginManager: IPluginManager;
  errorInfo: IErrorInfo;
  // layouts: object;
  nodes: any;
  workflow: IWorkflow;
  messager: IMessager;
  requestConfig: IRequestConfig;
  activeLayout: string;
  layouts: Array<string>; // layout stack
  engineId: string;

  activeEngine(engineID: string);
  loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    options?: ILoadOptions,
    updateNodes?: boolean
  );
  deleteUINode(layout: string);
  hideUINode(layout: string);
  getUINode(layout: string, uiNodeOnly: boolean = false);
  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]);
  setRequestConfig(requestConfig: IRequestConfig);
  pushLayout(layout: string);
  setWorkingMode(layout: string, workingMode: IWorkingMode);
  getWorkingMode(layout?: string);
}
