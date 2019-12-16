import { IObject, IDataSchema } from '../Common'
import { IDataMapper } from '../DataMapper'
import { IDataSource } from '../DataNode'
import { IPluginManager } from '../PluginManager'
import { IRequest, IErrorInfo, IRequestConfig } from '../Request'

export interface IDataEngineConfig {
  mapper: IDataMapper
  pluginManager: IPluginManager
  request: IRequest
}

export interface ILoadSchemaOption {
  engineId?: string
}

export interface ISendRequestOption {
  cacheID?: string
  data?: any
  config?: IRequestConfig
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}
export interface ILoadDataOption {
  loadID?: string
  config?: IRequestConfig
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}
export interface IUpdateDataOption {
  updateID?: string
  data?: any
  config?: IRequestConfig
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}
export interface IReplaceDataOption {
  replaceID?: string
  data?: any
  config?: IRequestConfig
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}
export interface IDeleteDataOption {
  deleteID?: string
  data?: any
  config?: IRequestConfig
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}

export interface IDataEngine {
  readonly id: string
  mapper: IDataMapper
  pluginManager: IPluginManager
  request: IRequest

  errorInfo?: IErrorInfo

  initializeConfig: (config?: IDataEngineConfig) => void

  loadSchema: (source: IDataSource|string, options?: ILoadSchemaOption) => Promise<IDataSchema|undefined>

  sendRequest: (source: IDataSource|string, method: string, options?: ISendRequestOption) => Promise<any>
  loadData: (source: IDataSource|string, options?: ILoadDataOption) => Promise<any>
  updateData: (source: IDataSource|string, options?: IUpdateDataOption) => Promise<any>
  replaceData: (source: IDataSource|string, options?: IReplaceDataOption) => Promise<any>
  deleteData: (source: IDataSource|string, options?: IDeleteDataOption) => Promise<any>
}
