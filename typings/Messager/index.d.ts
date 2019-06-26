export type ISetStateFunc = ({ key: string, value: any }) => any;

export interface IMessager {
  setStateFunc(setState: any, context?: any);
  removeStateFunc();
  sendMessage(...args: any);
}
