import _ from "lodash";
import {
  IWorkflow,
  IUINode,
  INodeController,
  ILoadOptions,
  IDataSource,
  INodeProps,
  IWorkingMode,
  IConnectOptions
} from "../../typings";

import {
  Cache,
  searchNodes,
  parseRootName,
  DataPool,
  submitToAPI
} from "../helpers";
import { UINode } from "../data-layer";

export default class Workflow implements IWorkflow {
  static instance: IWorkflow;
  static getInstance = () => {
    if (!Workflow.instance) {
      Workflow.instance = new Workflow();
    }
    return Workflow.instance as Workflow;
  };

  nodeController: INodeController = {} as INodeController;
  activeNode?: IUINode;
  workingMode: IWorkingMode = {
    mode: "new", // default we use new mode instead of edit mode
    options: {}
  };

  setNodeController(nodeController: INodeController) {
    this.nodeController = nodeController;
  }

  setWorkingMode(mode: IWorkingMode) {
    this.workingMode = mode;
  }

  activeLayout(layout: string, options?: ILoadOptions) {
    let promise = this.nodeController.loadUINode(layout, "", options, false);

    // send message
    promise.then((uiNode: IUINode) => {
      this.nodeController.messager.sendMessage(this.nodeController.engineId, {
        nodes: this.nodeController.nodes
      });
      this.activeNode = uiNode;
    });

    return promise;
  }

  deactiveLayout() {
    if (this.nodeController.activeLayout) {
      this.nodeController.hideUINode(this.nodeController.activeLayout);
      // active new nodes, now NodeController actived the new layout
      if (this.nodeController.activeLayout) {
        this.activeNode = this.nodeController.nodes[
          this.nodeController.activeLayout
        ];
      }
    }
  }

  private fetchNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any;
    if (nodes instanceof UINode) {
      uiNodes = nodes;
    } else {
      const layoutName = parseRootName(this.nodeController.activeLayout);
      uiNodes = searchNodes(nodes, layoutName);
    }
    return uiNodes;
  }

  removeNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = this.fetchNodes(nodes);
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

  refreshNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = this.fetchNodes(nodes);
    uiNodes.forEach((uiNode: IUINode) => {
      uiNode.sendMessage(true);
    });
  }

  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any) {}

  async updateState(nodes: Array<IUINode> | INodeProps, state: any) {
    let uiNodes: any = nodes;
    if (!_.isArray(nodes)) {
      uiNodes = searchNodes(nodes, this.nodeController.activeLayout);
    }

    // update state directly
    for (let index in uiNodes) {
      const uiNode = uiNodes[index];
      await uiNode.stateNode.updateState(state);
    }
    return uiNodes;
  }

  async saveNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = nodes;
    if (!_.isArray(nodes)) {
      uiNodes = searchNodes(nodes, this.nodeController.activeLayout);
    }

    let dataSources: Array<IDataSource> = [];
    // fetch data source
    uiNodes.forEach((uiNode: IUINode) => {
      dataSources.push(uiNode.dataNode.source);
    });

    // submit
    return await this.submit(dataSources);
  }

  async submit(sources: Array<IDataSource>) {
    return await submitToAPI(sources);
  }

  async submitToPool(connectOptions: IConnectOptions, refreshLayout?: string) {
    const dataPool = DataPool.getInstance();
    const { source, target, options } = connectOptions;
    let clearSource = _.get(options, "clearSource");
    dataPool.merge(source, target, clearSource);

    let promises: any = [];
    // refresh target ui node
    const selector = {
      datasource: target
    };
    const selectedNodes = searchNodes(selector, refreshLayout);

    for (let index in selectedNodes) {
      const node = selectedNodes[index];
      // send message
      await node.updateLayout();
    }
    return promises;
  }

  async removeFromPool(source: string, refreshLayout?: string) {
    const dataPool = DataPool.getInstance();
    dataPool.clear(source);

    // refresh target ui node
    // only refresh parent if the path suffixed with [0] or .0
    const updateSource = source.replace(/\.?\[?\d+\]?$/, "");
    const selector = {
      datasource: updateSource
    };

    const selectedNodes = searchNodes(selector, refreshLayout);
    for (let index in selectedNodes) {
      const node = selectedNodes[index];
      // send message
      await node.updateLayout();
    }
  }

  async updatePool(source: string, data: any, refreshLayout?: string) {
    const dataPool = DataPool.getInstance();
    dataPool.set(data, source);

    // refresh target ui node
    const selector = {
      datasource: source
    };
    const selectedNodes = searchNodes(selector, refreshLayout);
    for (let index in selectedNodes) {
      const node = selectedNodes[index];
      // send message
      await node.updateLayout();
    }
  }
}
