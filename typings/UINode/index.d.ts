import { IObject,IUISchema } from '../Common'
import { IDataNode } from '../DataNode'
import { IMessager } from '../Messager'
import { INodeController, IUINodeRenderer } from '../NodeController'
import { IPluginManager } from '../PluginManager'
import { IRequest, IRequestConfig } from '../Request'
import { IState, IStateNode } from '../StateNode'

export interface INodeProps {
  [anyKey: string]: any
}

export interface IStateInfo {
  data: any
  state: IState
  [name: string]: any
}

export interface IUINodeConfig {
  messager?: IMessager
  controller?: INodeController
  pluginManager?: IPluginManager
  request?: IRequest
}

export interface IUINode {
  id: string
  engineId?: string
  layoutKey?: string

  dataNode: IDataNode
  stateNode: IStateNode
  messager: IMessager
  controller: INodeController
  pluginManager: IPluginManager
  request: IRequest

  parent?: IUINode
  children?: IUINode[]

  schema: IUISchema
  props: IObject
  layoutMap: {
    [layoutKey: string]: IUINodeRenderer
  }
  errorInfo: IErrorInfo
  stateInfo: IStateInfo
  isLiveChildren: boolean

  parseBefore: (schema: IUISchema) => Promise<IUISchema>
  parse: () => Promise

  loadLayout: (schema?: string | IUISchema) => Promise<IUISchema>
  replaceLayout: (newSchema: string | IUISchema, route?: number[]) => Promise<IUISchema>
  refreshLayout: () => Promise<IUISchema>
  clearLayout: () => IUINode

  getSchema: (route?: number[]) => IUISchema | undefined
  getParent: (toTop?: boolean) => IUINode | undefined
  getChildren: (route?: number[]) => IUINode | IUINode[] | undefined
  sendMessage: (forceRefresh?: boolean) => void
}
