import _ from "lodash";

import {
  IUINode,
  IMessager,
  INodeController,
  INodeProps,
  ILayoutSchema,
  IRequestConfig,
  IErrorInfo
} from "../../typings";
import { UINode } from "../data-layer";
import { Messager, Request } from "../helpers";
import { searchNodes } from "../helpers";

export default class NodeController implements INodeController {
  static instance: INodeController;
  static getInstance = () => {
    if (!NodeController.instance) {
      NodeController.instance = new NodeController();
    }
    return NodeController.instance as NodeController;
  };

  // layout path
  errorInfo: IErrorInfo = {};
  // layouts: object = {};
  nodes: Array<IUINode> = [];
  messager: IMessager = Messager.getInstance();
  requestConfig: IRequestConfig = {};
  activeLayout: string = "";

  setRequestConfig(requestConfig: IRequestConfig) {
    this.requestConfig = requestConfig;
  }

  /**
   * Load a layout from remote or local
   * @param layout ILayoutSchema|string path of layout or loaded layout
   */
  async loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    autoLoadLayout: boolean = true,
    useCache: boolean = true
  ) {
    // TO Fix: getInstance can't pass the test case
    // const request = Request.getInstance(this.requestConfig);
    const request = Request.getInstance();
    request.setConfig(this.requestConfig);
    // get a unique id
    let rootName = "default";
    if (id) {
      rootName = id;
    } else {
      if (_.isObject(layout)) {
        rootName = _.get(layout, "id", "default");
      } else {
        rootName = layout;
      }
    }

    // use cached nodes
    let uiNode = this.nodes[rootName];
    if (!uiNode || useCache === false) {
      // default we load all default plugins
      uiNode = new UINode({}, request, rootName);
      if (autoLoadLayout) {
        await uiNode.loadLayout(layout);
      }

      this.nodes[rootName] = uiNode;
      this.activeLayout = rootName;
    }
    return uiNode;
  }

  deleteUINode(id: string): boolean {
    _.unset(this.nodes, id);

    // send message to caller
    return true;
  }

  getUINode(id: string) {
    return _.get(this.nodes, id);
  }

  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]) {
    let nodes: any = this.nodes;
    if (ids) {
      nodes = _.pick(this.nodes, ids);
    }
    _.forIn(nodes, (uiNode: IUINode) => {
      let searchedNodes = searchNodes(nodeSelector, uiNode.rootName);
      _.forEach(searchedNodes, (s: IUINode) => {
        s.messager.sendMessage(s.id, data);
      });
    });
  }
}
