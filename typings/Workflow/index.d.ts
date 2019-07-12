export interface ILoadOptions {}

export interface IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;
  activeLayout(layout: string, options?: ILoadOptions);
  deactiveLayout();
  removeNodes(selector: object);
  refreshNodes(selector: object);
  assignPropsToNode(selector: object, props: any);
  updateData(source: string, data: any);
  updateState(source: string, state: any);
}
