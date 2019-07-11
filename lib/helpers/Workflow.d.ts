import { IWorkflow, IUINode, INodeController, ILoadOptions } from "../../typings";
export default class Workflow implements IWorkflow {
    static instance: IWorkflow;
    static getInstance: () => Workflow;
    nodeController?: INodeController;
    activeNode?: IUINode;
    activeLayout(layout: string, options: ILoadOptions): void;
    deactiveLayout(): void;
    removeNodes(selector: object): void;
    refreshNodes(selector: object): void;
    assignPropsToNode(selector: object, props: any): void;
    updateData(source: string, data: any): void;
    updateState(source: string, state: any): void;
}
