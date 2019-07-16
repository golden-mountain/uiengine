import { IWorkflow, IUINode, INodeController, ILoadOptions, IDataSource, INodeProps } from "../../typings";
export default class Workflow implements IWorkflow {
    nodeController: INodeController;
    activeNode?: IUINode;
    constructor(nodeController: INodeController);
    activeLayout(layout: string, options?: ILoadOptions): Promise<IUINode>;
    deactiveLayout(): void;
    removeNodes(nodes: Array<IUINode> | INodeProps): void;
    refreshNodes(nodes: Array<IUINode> | INodeProps): void;
    assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any): void;
    updateState(nodes: Array<IUINode> | INodeProps, state: any): void;
    saveNodes(nodes: Array<IUINode> | INodeProps): void;
    updateData(source: string, data: any): void;
    saveSources(sources: Array<IDataSource>): void;
}
