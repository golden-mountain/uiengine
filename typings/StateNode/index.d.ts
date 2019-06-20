import { IUINode } from "../UINode";

export interface IState {}

export type StatePluginFunc = (this: IStateNode) => IState;

export interface IStateNode {
  getUINode(): IUINode;
  getState(key?: string): IState;
  renewStates(): IState;
  setState(key: string, value: any): IState;
  loadPlugins(newPlugins: Array<StatePluginFunc> = []);
  getPlugins(key?: string);
}
