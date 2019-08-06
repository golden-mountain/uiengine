import { IWorkflow, IUINode, INodeController, ILoadOptions, IDataSource, INodeProps, IConnectOptions } from "../../typings";
export default class Workflow implements IWorkflow {
    static instance: IWorkflow;
    static getInstance: () => Workflow;
    nodeController: INodeController;
    activeNode?: IUINode;
    setNodeController(nodeController: INodeController): void;
    activeLayout(layout: string, options?: ILoadOptions): any;
    deactiveLayout(): void;
    private fetchNodes;
    removeNodes(nodes: Array<IUINode> | INodeProps): void;
    refreshNodes(nodes: Array<IUINode> | INodeProps): void;
    assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any): void;
    updateState(nodes: Array<IUINode> | INodeProps, state: any): Promise<any>;
    saveNodes(nodes: Array<IUINode> | INodeProps): Promise<any>;
    submit(sources: Array<IDataSource>): Promise<any>;
    submitToPool(connectOptions: IConnectOptions, refreshLayout?: string): Promise<any>;
    removeFromPool(source: string, refreshLayout?: string): Promise<void>;
    updatePool(source: string, data: any, refreshLayout?: string): Promise<void>;
}
