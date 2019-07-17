import { IUINode } from "../UINode";

export interface ILoadOptions {
  container?: string;
  props?: object;
}

/// using working mode to decide how to load data from dataNode
export interface IWorkingMode {
  mode: string; // edit, new, if new ,defaultly we don't load data,
  options?: any;
}

export interface IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;
  workingMode?: IWorkingMode;
  // layout operations
  setWorkingMode(mode: IWorkingMode);
  setNodeController(nodeController: INodeController);
  activeLayout(layout: string, options?: ILoadOptions);
  deactiveLayout();
  // nodes operations
  removeNodes(nodes: Array<IUINode> | INodeProps);
  refreshNodes(nodes: Array<IUINode> | INodeProps);
  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any);
  updateState(nodes: Array<IUINode> | INodeProps, state: any);
  saveNodes(nodes: Array<IUINode> | INodeProps);

  // data operations
  updateData(source: IDataSource, data: any);
  submit(sources: Array<IDataSource>);
  // data pool
  submitToPool(connectOptions: IConnectOptions, refreshLayout?: string);
  removeFromPool(source: string, refreshLayout?: string);
}
