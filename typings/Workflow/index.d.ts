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
  setWorkingMode(mode: IWorkingMode);
  setNodeController(nodeController: INodeController);
  activeLayout(layout: string, options?: ILoadOptions);
  deactiveLayout();
  removeNodes(nodes: Array<IUINode> | INodeProps);
  refreshNodes(nodes: Array<IUINode> | INodeProps);
  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any);
  updateData(source: IDataSource, data: any);
  updateState(nodes: Array<IUINode> | INodeProps, state: any);
  saveSources(sources: Array<IDataSource>);
  saveNodes(nodes: Array<IUINode> | INodeProps);
}
