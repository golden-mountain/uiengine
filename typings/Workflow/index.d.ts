import { IObject } from '../Common'
import { IUINode } from "../UINode";
import { INodeController } from '../NodeController'

export interface ILoadOptions {
  container?: string;
  props?: object;
  parentNode?: IUINode; // parent ui node, default render in UIEngine
}

// using working mode to decide in the layout:
// how to load data for each dataNode;
// whether can edit the data of each dataNode;
export interface IWorkingMode {
  //  new: all dataNodes don't load data and are editable by default
  // edit: all dataNodes load data and are editable by default
  // view: all dataNodes load data and are not editable by default
  // customize: define the operation mode for each data source
  mode: 'new' | 'edit' | 'view' | 'customize';
  operationModes?: IOperationMode | IOperationMode[];
  options?: {
    urlParam?: IObject
    envParam?: IObject
    submitMethod?: string
    [otherKey: string]: any
  };
}

export interface IOperationMode {
  // create: the source needn't load remote data and is editable by default
  // delete: the source need load remote data and isn't editable
  // update: the source need load remote data and is editable by default
  //  view : the source need load remote data and isn't editable
  mode: 'create' | 'delete' | 'update' | 'view';
  source: string
  options?: {
    urlParam?: IObject
    envParam?: IObject
    submitMethod?: string
    [otherKey: string]: any
  };
}

export interface IWorkflow {
  nodeController: INodeController;
  activeNode?: IUINode;
  // workingMode?: IWorkingMode;
  // layout operations
  // setWorkingMode(mode: IWorkingMode);
  setNodeController(nodeController: INodeController);
  activeLayout(layout: string, options?: ILoadOptions);
  deactiveLayout();
  // nodes operations
  removeNodes(nodes: Array<IUINode> | INodeProps);
  refreshNodes(nodes: Array<IUINode> | INodeProps);
  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any);
  updateState(nodes: Array<IUINode> | INodeProps, state: any);
  saveNodes(nodes: Array<IUINode> | INodeProps);

  // data operations
  submit(sources: Array<IDataSource>);

  // data pool
  submitToPool(connectOptions: IConnectOptions, refreshLayout?: string);
  removeFromPool(source: string, refreshLayout?: string);
  updatePool(source: string, data: any, refreshLayout?: string);
}
