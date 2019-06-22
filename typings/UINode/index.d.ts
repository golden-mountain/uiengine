import { IRequest } from "../Request";

export interface INodeProps {}

export interface ILayoutSchema {
  component?: string;
  children?: Array<ILayoutSchema>;
  _children?: Array<ILayoutSchema>;
  name?: string;
  props?: object;
  [key: string]: any;
}

export interface IUINode {
  errorInfo: IErrorInfo;
  schema: ILayoutSchema;
  rootName: string;
  isLiveChildren: boolean;
  id: string;
  loadLayout(schema?: ILayoutSchema | string);
  loadRemoteLayout(url: stringremoteURL): Promise<AxiosPromise>;
  loadData(source: string);
  getSchema(path?: string): ILayoutSchema;
  replaceLayout(newSchema: ILayoutSchema | string);
  updateLayout();
  genLiveLayout(schema: ILayoutSchema, data: any);
  clearLayout();
  getChildren(route?: Array<Number>);
  getDataNode(): IDataNode;
  getNode(path?: string);
  updateState();
  getStateNode(): IStateNode;
  searchNodes(prop: object, root?: string);
  getPluginManager(): IPluginManager;
  getRequest(): IRequest;
  // getProps(): INodeProps;
}
