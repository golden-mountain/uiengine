import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";
import { IWorkflow, ILoadOptions, IWorkingMode } from "../Workflow";
import { IPluginManager } from '../PluginManager'

export interface IUINodeRenderer {
  uiNode: IUINode;
  engineId: string; // React Component ID
  options?: ILoadOptions;
  visible?: boolean;
  workingMode?: IWorkingMode;
}

export interface INodeController {
  id: string
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
  hideUINode(layout: string, clearSource: boolean = false);
  getUINode(layout: string, uiNodeOnly: boolean = false);
  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]);
  sendMessage(info: any, force: boolean = false);
  setRequestConfig(requestConfig: IRequestConfig);
  pushLayout(layout: string);
  setWorkingMode(layout: string, workingMode: IWorkingMode);
  getWorkingMode(layout?: string);
}
