import { IPluginManager } from '../PluginManager'
import { IErrorInfo } from '../Request'
import { IUINode } from '../UINode'

export interface IState {
  [stateKey: string]: any
}

export type StatePluginFunc = (
  this: IStateNode,
  stateNode: IStateNode
) => IState

export interface IStateNode {
  readonly id: string
  pluginManager: IPluginManager

  uiNode: IUINode

  state: IState
  errorInfo: IErrorInfo

  setState: (state: string | IState, value?: any) => IState
  getState: (key?: string) => IState | any
  renewStates: () => Promise<IState>

  useState: (state: IState) => Promise<IStateNode>

  setStateToDataPool: () => void
  getStateFromDataPool: () => void
  syncStateWithDataPool: () => void
}
