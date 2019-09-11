import { IUINode } from "../UINode";

export interface IState {
  [stateKey: string]: any
}

export type StatePluginFunc = (
  this: IStateNode,
  stateNode: IStateNode
) => IState;

export interface IStateNode {
  id: string
  pluginManager: IPluginManager;
  errorInfo: IErrorInfo;
  state: IState;
  uiNode: IUINode;
  getUINode(): IUINode;
  getState(key?: string): IState;
  renewStates();
  setState(key: string | IState, value?: any);
  updateState(state: IState);
  getPluginManager(): IPluginManager;
}
