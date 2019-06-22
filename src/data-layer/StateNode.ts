import _ from "lodash";

import { IState, IStateNode, IErrorInfo, IPluginManager } from "../../typings";
import { IUINode } from "../../typings/UINode";
import { Cache, PluginManager } from ".";
import * as statePlugins from "../plugins/state";

export default class StateNode implements IStateNode {
  private errorInfo: IErrorInfo = {};
  private state: IState = {};
  private uiNode: IUINode;
  private plugins: object = statePlugins;
  private pluginManager: IPluginManager = new PluginManager(this);

  constructor(uiNode: IUINode) {
    this.uiNode = uiNode;
    this.pluginManager.loadPlugins(statePlugins);
  }

  getUINode() {
    return this.uiNode;
  }

  getState(key?: string) {
    if (key) return _.get(this.state, key);
    return this.state;
  }

  getPlugins(key?: string) {
    return this.plugins;
  }

  renewStates(): IState {
    this.state = this.pluginManager.executePlugins("state");
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
