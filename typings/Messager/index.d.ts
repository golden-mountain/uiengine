export type ISetStateFunc = ({ key: string, value: any }) => any;

export interface IMessager {
  // send(msg: string, info: any, paths?: Array<path>);
  // listen(msg: string, callback: function);
  // broadcast(msg: string, info: any);
  setStateFunc(setState: any);
  // remove(msg: string);
  // clear(domain?: string);
}
