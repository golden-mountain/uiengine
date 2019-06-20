export interface IState {}

export type StatePluginFunc = (this: IStateNode) => IState;

export interface IStateNode {
  getState(): IState;
  renewStates(): IState;
  setState(key: string, value: any): IState;
  loadPlugins(newPlugins: Array<StatePluginFunc> = []);
}
