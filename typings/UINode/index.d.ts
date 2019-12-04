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
  readonly id: string
  readonly engineId?: string
  readonly layoutKey?: string

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

  parse: () => Promise

  loadLayout: (schema?: string | IUISchema, loadID?: string | number) => Promise<IUISchema>
  replaceLayout: (newSchema: string | IUISchema, route?: number[], replaceID?: string | number) => Promise<IUISchema>
  refreshLayout: (refreshID?: string | number) => Promise<IUISchema>
  clearLayout: () => IUINode

  getSchema: (route?: number[]) => IUISchema | undefined
  getParent: (toTop?: boolean) => IUINode | undefined
  getChildren: (route?: number[]) => IUINode | IUINode[] | undefined
  sendMessage: (forceRefresh?: boolean) => void
}
