export type ISetStateFunc = ({ key: string, value: any }) => any;

export interface IMessager {
  objectStateFuncMap: object;
  setStateFunc(id: string, setState: any);
  removeStateFunc(id: string);
  sendMessage(id: string, info: any);
}
