import { IWorkflow, IUINode, INodeController, ILoadOptions, IDataSource, INodeProps, IWorkingMode, IConnectOptions } from "../../typings";
export default class Workflow implements IWorkflow {
    static instance: IWorkflow;
    static getInstance: () => Workflow;
    nodeController: INodeController;
    activeNode?: IUINode;
    workingMode: IWorkingMode;
    setNodeController(nodeController: INodeController): void;
    setWorkingMode(mode: IWorkingMode): void;
    activeLayout(layout: string, options?: ILoadOptions): any;
    deactiveLayout(): void;
    private fetchNodes;
    removeNodes(nodes: Array<IUINode> | INodeProps): void;
    refreshNodes(nodes: Array<IUINode> | INodeProps): void;
    assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any): void;
    updateState(nodes: Array<IUINode> | INodeProps, state: any): void;
    saveNodes(nodes: Array<IUINode> | INodeProps): void;
    submit(sources: Array<IDataSource>): void;
    submitToPool(connectOptions: IConnectOptions, refreshLayout?: string): void;
    removeFromPool(source: string, refreshLayout?: string): void;
    updatePool(source: string, data: any, refreshLayout?: string): void;
}
