import { IUINode } from "../UINode";

export interface ILoadOptions {
  container?: string;
  props?: object;
}

export interface IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;
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
