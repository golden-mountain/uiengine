import _ from "lodash";

import {
  IState,
  IStateNode,
  IErrorInfo,
  IPluginManager,
  IUINode
} from "../../typings";
import { searchDepsNodes, PluginManager } from "../helpers";

export default class StateNode implements IStateNode {
  errorInfo: IErrorInfo = {};
  state: IState = {};
  uiNode: IUINode;
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(uiNode: IUINode) {
    this.uiNode = uiNode;
  }

  getUINode() {
    return this.uiNode;
  }

  getState(key?: string) {
    if (key) return _.get(this.state, key);
    return this.state;
  }

  async renewStates() {
    this.state = await this.pluginManager.executePlugins("state.resolver");

    // update dependence state
    const depNodes = searchDepsNodes(this.uiNode);
    for (let key in depNodes) {
      const node = depNodes[key];
      await node.getStateNode().renewStates();
    }

    this.uiNode.sendMessage();
    return this.state;
  }

  setState(key: string, value: any): IState {
    _.set(this.state, key, value);
    return this.state;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }
}
