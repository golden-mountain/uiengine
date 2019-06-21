import _ from "lodash";

import { IState, IStateNode, StatePluginFunc } from "../../typings/StateNode";
import { IUINode } from "../../typings/UINode";
import { Cache } from ".";
import * as statePlugins from "../plugins/state";

export default class StateNode implements IStateNode {
  private errorInfo: IErrorInfo = {};
  private state: IState = {};
  private uiNode: IUINode;
  private plugins: object = statePlugins;
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

  getPlugins(key?: string) {
    return this.plugins;
  }

  renewStates(): IState {
    _.forEach(this.plugins, (plugin: StatePluginFunc, name: string) => {
      try {
        const result = plugin.call(this, this);
        _.set(this.state, name, result);
      } catch (e) {
        this.errorInfo = {
          code: e.message
        };
        // console.log(e.message);
      }
    });
    return this.state;
  }

  setState(key: string, value: any): IState {
    _.set(this.state, key, value);
    return this.state;
  }

  loadPlugins(newPlugins: object = {}) {
    this.plugins = _.merge(this.plugins, newPlugins);
    return this.plugins;
  }
}
