import { IRequest } from "../Request";
import { IMessager } from "../Messager";
import { IDataNode } from "../DataNode";
import { IState, IStateNode } from "../StateNode";

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
  id: string
  dataNode: IDataNode
  stateNode: IStateNode
  request: IRequest
  messager: IMessager
  pluginManager: IPluginManager

  parent?: IUINode
  children: Array<IUINode>

  schema: ILayoutSchema
  rootName: string
  errorInfo: IErrorInfo
  isLiveChildren: boolean

  props: object
  stateInfo: IStateInfo
  workingMode?: IWorkingMode
  nodes: {
    [name: string]: IUINodeRenderer
  } = {}

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
  sendMessage(force: boolean = false)
}
