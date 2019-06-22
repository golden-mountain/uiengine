import { IUINode } from "../UINode";

export interface IState {}

export type StatePluginFunc = (
  this: IStateNode,
  stateNode: IStateNode
) => IState;

export interface IStateNode {
  getUINode(): IUINode;
  getState(key?: string): IState;
  renewStates(): IState;
  setState(key: string, value: any): IState;
  // loadPlugins(newPlugins?: object);
  // getPlugins(key?: string);
  // setErrorInfo(key: string, value: any): IErrorInfo;
  getPluginManager(): IPluginManager;
}
