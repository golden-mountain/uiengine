import { ReactNode } from 'react'
import { IObject, IUISchema } from '../Common'
import { IErrorInfo, IRequestConfig } from '../Request'
import { IUINode } from '../UINode'

export interface IUIEngineWidgetsConfig {
  messager?: ReactNode
  componentWrapper?: ReactNode
  uiengineWrapper?: ReactNode
}

export interface IUIEngineConfig {
  requestConfig: IRequestConfig
  widgetConfig?: IUIEngineWidgetsConfig
  ideMode?: boolean
}

export interface IUIEngineProps {
  layouts: Array<string | IUISchema | ILayoutInfo>
  config: IUIEngineConfig
  [anyKey: string]: any
}

export interface IUIEngineStates {
  nodes: Array<IUINodeRenderer>
  activeNodeID: string
  error?: IErrorInfo
  [anyKey: string]: any
}

export interface ILayoutInfo {
  id?: string
  layout: string | IUISchema
  workingMode?: IOperationMode[]
}

export interface IOperationMode {
  domain: string
  mode: 'create' | 'delete' | 'update' | 'view'
  uriParam?: IObject
  envParam?: IObject
  submitMethod?: string
}
