import { AxiosPromise } from 'axios'

import { IObject, IDataSchema, IDataNodeSchema } from '../Common'
import { IDataEngine } from '../DataEngine'
import { IDataPool } from '../DataPool'
import { IPluginManager } from '../PluginManager'
import { IErrorInfo } from '../Request'
import { IUINode } from '../UINode'

export interface IDataSource {
  source: string        // data access route
  schema?: string       // data schema lineage, sometimes is not same with source
  defaultValue?: any
  autoload?: boolean
  loadOptions?: IObject
}

export interface IDataConnector {
  from?: string
  to: string
}

export interface IDataNodeConfig {
  id?: string
  dataEngine?: IDataEngine
  dataPool?: IDataPool
  pluginManager?: IPluginManager
  request?: IRequest
}

export interface IDataGetOption {
  path?: string
}
export interface IDataLoadOption {
  loadID?: string | number
}
export interface IDataUpdateOption {
}
export interface IDataDeleteOption {
  clearPool?: boolean
}

export interface IDataNode {
  readonly id: string
  dataEngine: IDataEngine
  dataPool: IDataPool
  pluginManager: IPluginManager
  request: IRequest

  uiNode: IUINode
  source: IDataSource

  schema?: IDataSchema | IDataNodeSchema
  rootSchema?: IDataSchema

  data: any
  errorInfo?: IErrorInfo

  getSchema: (path?: string) => IDataSchema | IDataNodeSchema | any

  getData: (options?: IDataGetOption) => any
  loadData: (source?: string|IDataSource, options?: IDataLoadOption) => Promise<any>
  updateData: (value: any, options?: IDataUpdateOption) => Promise<any>
  deleteData: (options?: IDataDeleteOption) => Promise<any>

  getRow: (index: number) => any
  createRow: (value: any, insertIndex?: number) => Promise<any>
  updateRow: (value: any, updateIndex?: number) => Promise<any>
  deleteRow: (index: number|number[]) => Promise<any>
}
