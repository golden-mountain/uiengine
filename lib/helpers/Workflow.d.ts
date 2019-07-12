import { IWorkflow, IUINode, INodeController, ILoadOptions } from "../../typings";
export default class Workflow implements IWorkflow {
    nodeController: INodeController;
    activeNode?: IUINode;
    constructor(nodeController: INodeController);
    activeLayout(layout: string, options?: ILoadOptions): Promise<IUINode>;
    deactiveLayout(): void;
    removeNodes(selector: object): void;
    refreshNodes(selector: object): void;
    assignPropsToNode(selector: object, props: any): void;
    updateData(source: string, data: any): void;
    updateState(source: string, state: any): void;
}
