import _ from "lodash";

import { IState, IStateNode, StatePluginFunc } from "../../typings/StateNode";
import { IUINode } from "../../typings/UINode";
import { Cache } from ".";
import * as statePlugins from "../plugins/state";

export default class StateNode implements IStateNode {
  private state: IState = {};
  private uiNode: IUINode;
  private plugins: object = statePlugins;
  constructor(uiNode: IUINode) {
    this.uiNode = uiNode;
    this.loadPlugins();
  }

  getState(): IState {
    return this.state;
  }

  renewStates(): IState {
    return this.state;
  }

  setState(key: string, value: any): IState {
    return this.state;
  }

  loadPlugins(newPlugins: object = {}): Array<IState> {
    let plugins = _.merge(this.plugins, newPlugins);

    _.forEach(plugins, (v: StatePluginFunc, name: string) => {
      console.log(v, name);
    });
    return [];
  }
}
