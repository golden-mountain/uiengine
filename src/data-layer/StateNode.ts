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
  id: string
  pluginManager: IPluginManager
  errorInfo: IErrorInfo = {};
  state: IState = {};
  uiNode: IUINode;

  constructor(uiNode: IUINode) {
    this.uiNode = uiNode;

    this.id = _.uniqueId('StateNode-')
    this.pluginManager = PluginManager.getInstance()
    this.pluginManager.register(
      this.id,
      {
        categories: ['state.resolver']
      }
    )
  }

  getUINode() {
    return this.uiNode;
  }

  getState(key?: string) {
    if (key) return _.get(this.state, key);
    return this.state;
  }

  async renewStates() {
    const exeResult = await this.pluginManager.executePlugins(
      this.id,
      'state.resolver',
      { stateNode: this.uiNode.stateNode }
    );
    if (exeResult) {
      exeResult.results.forEach((result) => {
        if (!_.isEmpty(result.result)) {
          Object.assign(this.state, result.result)
        }
      })
    }

    // update dependence state
    const depNodes = searchDepsNodes(this.uiNode);
    for (let key in depNodes) {
      const node = depNodes[key];
      await node.stateNode.renewStates();
    }
    this.uiNode.sendMessage();
    return this.state;
  }

  setState(key: string | IState, value?: any): IState {
    if (typeof key === "object") {
      _.merge(this.state, key);
    } else {
      _.set(this.state, key, value);
    }

    return this.state;
  }

  async updateState(state: IState) {
    this.setState(state);
    this.uiNode.sendMessage();

    // update dependence state
    const depNodes = searchDepsNodes(this.uiNode);
    for (let key in depNodes) {
      const node = depNodes[key];
      await node.stateNode.renewStates();
    }
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }
}
