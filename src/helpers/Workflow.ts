import _ from "lodash";
import {
  IWorkflow,
  IUINode,
  INodeController,
  ILoadOptions,
  IDataSource,
  INodeProps
} from "../../typings";

import { searchNodes, parseRootName } from "../helpers";
import { UINode } from "../data-layer";

export default class Workflow implements IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;

  constructor(nodeController: INodeController) {
    this.nodeController = nodeController;
  }

  async activeLayout(layout: string, options?: ILoadOptions) {
    let uiNode: IUINode = await this.nodeController.loadUINode(
      layout,
      "",
      options
    );

    this.activeNode = uiNode;
    return uiNode;
  }

  deactiveLayout() {
    if (this.nodeController.activeLayout) {
      this.nodeController.deleteUINode(this.nodeController.activeLayout);
      // active new nodes
      if (this.nodeController.activeLayout) {
        this.activeNode = this.nodeController.nodes[
          this.nodeController.activeLayout
        ];
      }
    }
  }

  removeNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any;
    if (nodes instanceof UINode) {
      uiNodes = nodes;
    } else {
      const layoutName = parseRootName(this.nodeController.activeLayout);
      uiNodes = searchNodes(nodes, layoutName);
    }

    uiNodes.forEach((uiNode: IUINode) => {
      const parentNode: any = uiNode.parent;
      if (parentNode) {
        _.remove(parentNode.children, (node: IUINode) => {
          return node === uiNode;
        });

        _.remove(parentNode.schema.children, (schema: any) => {
          return _.isEqual(schema, uiNode.schema);
        });
        parentNode.sendMessage(true);
      }
    });
  }

  refreshNodes(nodes: Array<IUINode> | INodeProps) {}

  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any) {}

  updateState(nodes: Array<IUINode> | INodeProps, state: any) {}

  saveNodes(nodes: Array<IUINode> | INodeProps) {}

  updateData(source: string, data: any) {}

  saveSources(sources: Array<IDataSource>) {}
}
