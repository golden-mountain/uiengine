import _ from 'lodash'

import { PluginManager } from '../helpers/PluginManager'
import { searchDepsNodes } from '../helpers/utils'

import {
  IDataNode,
  IDataPool,
  IErrorInfo,
  IPluginManager,
  IPluginResult,
  IState,
  IStateNode,
  IUINode,
} from '../../typings'

export default class StateNode implements IStateNode {
  readonly id: string = _.uniqueId('StateNode-')
  pluginManager: IPluginManager = PluginManager.getInstance()

  uiNode: IUINode

  errorInfo: IErrorInfo = {}

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
    this.uiNode = uiNode

    this.pluginManager.register(
      this.id,
      { categories: ['state.resolver'] }
    )
  }

  setState(state: string | IState, value?: any) {
    const currentState = this.state
    if (_.isObject(state)) {
      _.assign(currentState, state)
    } else if (_.isString(state) && state) {
      _.set(currentState, state, value)
    }

    this.state = currentState
    return currentState
  }

  getState(key?: string) {
    if (_.isString(key) && key) {
      return _.get(this.state, key)
    }
    return this.state
  }

  async renewStates() {
    // exec plugins to generate each state
    const { results } = await this.pluginManager.executePlugins(
      this.id,
      'state.resolver',
      { stateNode: this }
    )
    if (_.isArray(results)) {
      const currentState = this.state
      results.forEach((item: IPluginResult) => {
        const newState = item.result
        if (_.isObject(newState) && !_.isEmpty(newState)) {
          _.assign(currentState, newState)
        }
      })
      this.state = currentState
    }

    // update states of dependence nodes
    const depNodes = searchDepsNodes(this.uiNode)
    for (let node of depNodes) {
      await node.stateNode.renewStates()
    }

    // update UI
    this.uiNode.sendMessage()
    return this.state
  }

  async useState(state: IState) {
    this.setState(state)

    // update states of dependence nodes
    const depNodes = searchDepsNodes(this.uiNode)
    for (let node of depNodes) {
      await node.stateNode.renewStates()
    }

    // update UI
    this.uiNode.sendMessage()

    // retrun itself
    return this
  }

  setStateToDataPool() {
    const dataNode: IDataNode = _.get(this, ['uiNode', 'dataNode'])
    const dataPool: IDataPool = _.get(this, ['uiNode', 'dataNode', 'dataPool'])
    if (!_.isNil(dataNode) && !_.isNil(dataPool)) {
      const dataSource = _.get(dataNode, ['source', 'source'])
      if (_.isString(dataSource) && dataSource) {
        dataPool.setInfo(dataSource, { key: 'state', value: this.state })
      }
    }
  }
  getStateFromDataPool() {
    const dataNode: IDataNode = _.get(this, ['uiNode', 'dataNode'])
    const dataPool: IDataPool = _.get(this, ['uiNode', 'dataNode', 'dataPool'])
    if (!_.isNil(dataNode) && !_.isNil(dataPool)) {
      const dataSource = _.get(dataNode, ['source', 'source'])
      if (_.isString(dataSource) && dataSource) {
        return dataPool.getInfo(dataSource, 'state')
      }
    }
  }
  syncStateWithDataPool() {
    const stateInPool = this.getStateFromDataPool()
    if (!_.isEqual(stateInPool, this.localState)) {
      this.setStateToDataPool()
    }
  }
}
