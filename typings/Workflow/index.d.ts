import { IObject, IUISchema } from '../Common'
import { INodeController } from '../NodeController'
import { IPluginManager } from '../PluginManager'
import { IUINode } from '../UINode'

export interface ILoadOptions {
  container?: string
  parentNode?: IUINode // parent ui node, default render in UIEngine
  props?: IObject
}

// using working mode to decide in the layout:
// how to load data for each dataNode
// whether can edit the data of each dataNode
export interface IWorkingMode {
  //  new: all dataNodes don't load data and are editable by default
  // edit: all dataNodes load data and are editable by default
  // view: all dataNodes load data and are not editable by default
  // customize: define the operation mode for each data source
  mode: 'new' | 'edit' | 'view' | 'customize'
  operationModes?: IOperationMode | IOperationMode[]
  options?: {
    envParam?: IObject
    queryParam?: IObject
    urlParam?: IObject
    submitMethod?: string
    [otherKey: string]: any
  }
}

export interface IOperationMode {
  // create: the source needn't load remote data and is editable by default
  // delete: the source need load remote data and isn't editable
  // update: the source need load remote data and is editable by default
  //  view : the source need load remote data and isn't editable
  mode: 'create' | 'delete' | 'update' | 'view'
  source: string
  options?: {
    envParam?: IObject
    queryParam?: IObject
    urlParam?: IObject
    submitMethod?: string
    [otherKey: string]: any
  }
}

export interface IAddLayoutConfig {
  schema: string | IUISchema
  workingMode?: IWorkingMode
  loadOptions?: ILoadOptions
}

export interface IWorkflow {
  readonly id: string
  controller?: INodeController
  pluginManager: IPluginManager

  setController: (controller: INodeController) => void

  // layout operations
  addLayout: (
    engineId: string,
    layoutKey: string,
    layoutConfig: IAddLayoutConfig,
  ) => Promise<IUINode> | undefined
  removeLayout: (
    layoutKey: string,
    clearData?: boolean,
  ) => boolean
  locateLayout: (layoutKey?: string) => string | undefined
  showLayout: (layoutKey?: string) => boolean
  hideLayout: (layoutKey?: string) => boolean

  // nodes operations
  removeNodes: (nodes: Array<IUINode> | INodeProps) => void
  refreshNodes: (nodes: Array<IUINode> | INodeProps) => void
  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any)
  updateState(nodes: Array<IUINode> | INodeProps, state: any)
  saveNodes(nodes: Array<IUINode> | INodeProps)

  // data operations
  submit(sources: Array<IDataSource>)

  // data pool operations
  submitToPool(connectOptions: IConnectOptions, refreshLayout?: string)
  removeFromPool(source: string, refreshLayout?: string)
  updatePool(source: string, data: any, refreshLayout?: string)
}
