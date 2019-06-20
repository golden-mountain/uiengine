export interface IState {}

export type StatePluginFunc = (this: IStateNode) => IState;

export interface IStateNode {
  getState(key?: string): IState;
  renewStates(): IState;
  setState(key: string, value: any): IState;
  loadPlugins(newPlugins: Array<StatePluginFunc> = []);
  getPlugins(key?: string);
}
