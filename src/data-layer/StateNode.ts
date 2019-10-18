import _ from "lodash";

import {
  IState,
  IStateNode,
  IErrorInfo,
  IPluginManager,
  IPluginResult,
  IUINode,
  IDataNode,
  IDataPool,
} from "../../typings";
import { searchDepsNodes, PluginManager } from "../helpers";

export default class StateNode implements IStateNode {
  id: string;
  uiNode: IUINode;
  pluginManager: IPluginManager;
  errorInfo: IErrorInfo = {};

  private localState: IState = {}
  set state(newState: IState) {
    if (_.isObject(newState)) {
      this.localState = _.cloneDeep(newState)
    }

    this.setStateToDataPool()
  }

  get state() {
    return _.cloneDeep(this.localState)
  }

  constructor(uiNode: IUINode) {
    this.uiNode = uiNode;

    this.id = _.uniqueId("StateNode-");
    this.pluginManager = PluginManager.getInstance();
    this.pluginManager.register(this.id, {
      categories: ["state.resolver"]
    });
  }

  getUINode() {
    return this.uiNode;
  }

  getState(key?: string) {
    if (_.isString(key) && key) {
      return _.get(this.state, key)
    }
    return this.state;
  }

  setStateToDataPool() {
    const dataNode: IDataNode = _.get(this, 'uiNode.dataNode')
    const dataPool: IDataPool = _.get(this, 'uiNode.dataNode.dataPool')
    if (!_.isNil(dataNode) && !_.isNil(dataPool)) {
      const dataSource = _.get(dataNode, ['source', 'source'])
      if (_.isString(dataSource) && dataSource) {
        dataPool.setInfo(dataSource, { key: 'state', value: this.localState })
      }
    }
  }

  getStateFromDataPool() {
    const dataNode: IDataNode = _.get(this, 'uiNode.dataNode')
    const dataPool: IDataPool = _.get(this, 'uiNode.dataNode.dataPool')
    if (!_.isNil(dataNode) && !_.isNil(dataPool)) {
      const dataSource = _.get(dataNode, ['source', 'source'])
      if (_.isString(dataSource) && dataSource) {
        return dataPool.getInfo(dataSource, 'state')
      }
    }
  }

  async renewStates() {
    const exeResult = await this.pluginManager.executePlugins(
      this.id,
      "state.resolver",
      { stateNode: this.uiNode.stateNode }
    );
    if (exeResult) {
      const currentState = this.state
      exeResult.results.forEach((item: IPluginResult) => {
        const newState = item.result
        if (_.isObject(newState) && !_.isEmpty(newState)) {
          _.merge(currentState, newState)
        }
      })
      this.state = currentState
    }

    // update dependence state
    const depNodes = searchDepsNodes(this.uiNode);
    for (let node of depNodes) {
      await node.stateNode.renewStates();
    }

    this.uiNode.sendMessage();
    return this.state;
  }

  setState(key: string | IState, value?: any): IState {
    let currentState = this.state
    if (_.isObject(key)) {
      _.merge(currentState, key)
    } else if (_.isString(key) && key) {
      _.set(currentState, key, value)
    }

    this.state = currentState
    return currentState
  }

  async updateState(state: IState) {
    this.setState(state);
    this.uiNode.sendMessage();

    // update dependence state
    const depNodes = searchDepsNodes(this.uiNode);
    for (let node of depNodes) {
      await node.stateNode.renewStates();
    }
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }
}
