import _ from "lodash";
import {
  IWorkflow,
  IUINode,
  INodeController,
  ILoadOptions
} from "../../typings";

export default class Workflow implements IWorkflow {
  static instance: IWorkflow;
  static getInstance = () => {
    if (!Workflow.instance) {
      Workflow.instance = new Workflow();
    }
    return Workflow.instance as Workflow;
  };

  nodeController?: INodeController;
  activeNode?: IUINode;

  activeLayout(layout: string, options: ILoadOptions) {}

  deactiveLayout() {}

  removeNodes(selector: object) {}

  refreshNodes(selector: object) {}

  assignPropsToNode(selector: object, props: any) {}

  updateData(source: string, data: any) {}

  updateState(source: string, state: any) {}
}
