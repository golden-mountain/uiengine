import { ReactNode } from 'react'

import { IObject, IUISchema } from '../Common'
import { INodeController, IUINodeRenderer } from '../NodeController'
import { IErrorInfo, IRequestConfig } from '../Request'
import { IUINode, INodeProps } from '../UINode'
import { ILoadOptions, IWorkingMode } from '../Workflow'

export interface IUIEngineWidgetsConfig {
  messager?: ReactNode
  componentWrapper?: ReactNode
  uiengineWrapper?: ReactNode
}

export interface IUIEngineConfig {
  requestConfig?: IRequestConfig
  widgetConfig?: IUIEngineWidgetsConfig
  ideMode?: boolean
}

export interface ILayoutInfo {
  id?: string
  layout: string | IUISchema
  workingMode?: IWorkingMode
}

export interface IUIEngineProps {
  id?: string
  layouts: Array<string | IUISchema | ILayoutInfo>
  config?: IUIEngineConfig
  loadOptions?: ILoadOptions
  onEngineCreate?: (engineId: string, controller: INodeController) => void
  [anyKey: string]: any
}

export interface IUIEngineStates {
  layoutMap: {
    [layoutKey: string]: IUINodeRenderer
  }
  activeNodeID: string
  error?: IErrorInfo
  time?: number
  [anyKey: string]: any
}
