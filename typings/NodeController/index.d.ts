import { IUISchema, IObject } from '../Common'
import { IMessager } from '../Messager'
import { IPluginManager } from '../PluginManager'
import { IRequest, IErrorInfo } from '../Request'
import { IUINode, INodeProps } from '../UINode'
import { IWorkflow, ILoadOptions, IWorkingMode } from '../Workflow'

export interface IUINodeRenderer {
  engineId: string
  layoutKey: string
  uiNode: IUINode
  options?: ILoadOptions
  visible?: boolean
  workingMode?: IWorkingMode
}

export interface IActivateEngineOption {
  layoutKey?: string | ((loadedLayouts?: string[]) => string)
  autoRefresh?: boolean | ((nextLayout: string, prevLayout: string) => boolean)
  onLayoutRefresh?: (rootNode: IUINode) => void
}

export interface IActivateLayoutOption {
  beforeEngineExchange?: (nextActive: string, prevActive: string) => boolean
  beforeLayoutExchange?: (nextActive: string, prevActive: string) => boolean
  autoRefresh?: boolean | ((nextLayout: string, prevLayout: string) => boolean)
  onLayoutRefresh?: (rootNode: IUINode) => void
}

export interface INodeController {
  id: string
  messager: IMessager
  pluginManager: IPluginManager
  request: IRequest
  workflow: IWorkflow

  activeEngine: string
  activeLayout: string
  errorInfo: IErrorInfo
  engineMap: {
    [engineId: string]: string[]
  }
  layoutMap: {
    [layoutKey: string]: IUINodeRenderer
  }

  activateEngine: (
    engineId?: string,
    options?: IActivateEngineOption,
  ) => boolean
  activateLayout: (
    layoutKey?: string | ((layoutsInActiveEngine?: string[]) => string),
    options?: IActivateLayoutOption,
  ) => boolean
  setRequestConfig: (
    requestConfig: IRequestConfig,
    id?: string,
  ) => void
  getRequestConfig: (
    id?: string,
    devMode?: boolean,
  ) => IRequestConfig | undefined
  setWorkingMode: (
    workingMode: IWorkingMode,
    layoutKey?: string,
  ) => boolean
  getWorkingMode: (
    layoutKey?: string,
  ) => IWorkingMode | undefined
  loadLayout: (
    engineId?: string,
    layoutKey?: string,
    schema?: string | IUISchema,
    workingMode?: IWorkingMode,
    options?: ILoadOptions,
    autoRefresh?: boolean,
  ) => Promise<IUINode>
  getLayout: (
    layoutKey?: string,
    uiNodeOnly?: boolean,
  ) => IUINodeRenderer | IUINode | undefined
  hideLayout:(
    layoutKey?: string,
    clearData?: boolean,
  ) => boolean
  removeLayout: (
    layoutKey?: string,
    clearData?: boolean,
  ) => boolean
  placeLayout: (
    layoutKey?: string,
    newIndex?: number,
  ) => boolean
  sendMessageToUIEngine: (
    engines?: string | string[],
    info: IObject,
    forceRefresh?: boolean,
    forAll?: boolean,
  ) => boolean
  castMessageToLayoutNode: (
    layouts?: string | string[],
    info: IObject,
    selector?: INodeProps,
    forAll?: boolean,
  ) => boolean
}
