export type ISetStateFunc = ({ key: string, value: any }) => any;

export interface IMessager {
  setStateFunc(schemaID: string, setState: any);
  removeStateFunc(schemaID: string);
  sendMessage(schemaID: string, info: any);
}
