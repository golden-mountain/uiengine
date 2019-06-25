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
  layouts: object = {};
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
    if (id) rootName = id;
    if (_.isObject(layout)) {
      rootName = _.get(layout, "id", "default");
    } else {
      rootName = layout;
    }

    // default we load all default plugins
    const uiNode = new UINode({}, request, rootName, true);
    if (autoLoadLayout) {
      await uiNode.loadLayout(layout);
    }

    this.layouts[rootName] = uiNode;
    return uiNode;
  }

  deleteUINode(id: string): boolean {
    _.unset(this.layouts, id);

    // send message to caller
    return true;
  }

  getUINode(id: string) {
    return _.get(this.layouts, id);
  }

  sendMessage(nodeSelector: INodeProps, data: any, message: string) {}
}
