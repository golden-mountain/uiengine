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
import { Messager, UINode, Request } from ".";

export default class NodeController implements INodeController {
  // layout path
  errorInfo: IErrorInfo = {};
  // layouts: object = {};
  nodes: Array<IUINode> = [];
  messager: IMessager;
  requestConfig: IRequestConfig;

  constructor(requestConfig: any) {
    this.messager = new Messager();
    this.requestConfig = requestConfig;
  }

  /**
   * Load a layout from remote or local
   * @param layout ILayoutSchema|string path of layout or loaded layout
   */
  async loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    autoLoadLayout: boolean = true
  ) {
    const request = new Request(this.requestConfig);

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

    // default we load all default plugins
    const uiNode = new UINode({}, request, rootName);
    if (autoLoadLayout) {
      await uiNode.loadLayout(layout);
    }

    this.nodes[rootName] = uiNode;
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
      let searchedNodes = uiNode.searchNodes(nodeSelector);
      _.forEach(searchedNodes, (s: IUINode) => {
        s.messager.sendMessage(s.id, data);
      });
    });
  }
}
