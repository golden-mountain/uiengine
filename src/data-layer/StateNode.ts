import _ from "lodash";

import { IState, IStateNode, IErrorInfo, IPluginManager } from "../../typings";
import { IUINode } from "../../typings/UINode";
import { PluginManager } from ".";

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
    // console.log(this.state, key, "...........");
    if (key) return _.get(this.state, key);
    return this.state;
  }

  async renewStates(uiNode?: IUINode) {
    this.state = await this.pluginManager.executePlugins("state");
    // console.log(
    //   "state node:",
    //   this.uiNode.schema.datasource,
    //   ":",
    //   this.state,
    //   "\n"
    // );

    if (!uiNode) uiNode = this.uiNode;

    // update children
    for (let i in uiNode.children) {
      const child = uiNode.children[i];
      await child.stateNode.renewStates();
    }

    // update dependence state
    const depNodes = uiNode.searchDepsNodes();
    for (let key in depNodes) {
      const node = depNodes[key];
      await node.getStateNode().renewStates();
    }

    const state = { state: uiNode.stateNode.state, data: uiNode.dataNode.data };
    // console.log("update visible on State Node: ", " id:", this.uiNode.id);
    uiNode.messager.sendMessage(uiNode.id, state);
    return state;
  }

  setState(key: string, value: any): IState {
    _.set(this.state, key, value);
    return this.state;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }
}
