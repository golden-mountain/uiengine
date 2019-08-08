import { IRequest } from "../Request";
import { IMessager } from "../Messager";
import { IDataNode } from "../DataNode";
import { IState } from "../StateNode";

export interface INodeProps {}

export interface IStateInfo {
  data: any;
  state: IState;
  [name: string]: any;
}

export interface ILayoutSchema {
  component?: string;
  children?: Array<ILayoutSchema>;
  _children?: Array<ILayoutSchema>;
  name?: string;
  props?: object;
  [key: string]: any;
}

export interface IUINode {
  request: IRequest;
  dataNode: IDataNode;
  stateNode: IStateNode = new StateNode(this);
  children: Array<UINode> = [];
  pluginManager: IPluginManager = new PluginManager(this);
  errorInfo: IErrorInfo;
  schema: ILayoutSchema;
  rootName: string;
  isLiveChildren: boolean;
  id: string;
  messager: IMessager;
  props: object;
  parent?: IUINode;
  stateInfo: IStateInfo;
  workingMode?: IWorkingMode;

  loadLayout(schema?: ILayoutSchema | string, workingMode?: IWorkingMode);
  loadRemoteLayout(url: stringremoteURL): Promise<AxiosPromise>;
  // loadData(source: IDataSource, workingMode?: IWorkingMode);
  getSchema(path?: string): ILayoutSchema;
  replaceLayout(newSchema: ILayoutSchema | string, workingMode?: IWorkingMode);
  updateLayout(workingMode?: IWorkingMode);
  genLiveLayout(schema: ILayoutSchema, data: any);
  clearLayout();
  getChildren(route?: Array<Number>);
  getNode(path?: string);
  // updateState();
  sendMessage(force: boolean = false) {
}
