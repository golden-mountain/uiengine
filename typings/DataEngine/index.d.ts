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

export interface ISendRequestOption {
  data?: any
  config?: IRequestConfig
  cacheID?: string
  engineId?: string
  layoutKey?: string
  [otherKey: string]: any
}

export interface ILoadDataOption {
  engineId?: string
  layoutKey?: string
  loadID?: string
}

export interface IOtherOperOption {
  engineId?: string
  layoutKey?: string
}

export interface IDataEngine {
  readonly id: string
  mapper: IDataMapper
  pluginManager: IPluginManager
  request: IRequest

  errorInfo?: IErrorInfo

  initializeConfig: (config?: IDataEngineConfig) => void

  loadSchema: (source: IDataSource|string, options?: IOtherOperOption) => Promise<IDataSchema|undefined>

  sendRequest: (source: IDataSource|string, method: string, options?: ISendRequestOption) => Promise<any>
  loadData: (source: IDataSource|string, options?: ILoadDataOption) => Promise<any>
  updateData: (source: IDataSource|string, data: any, options?: IOtherOperOption) => Promise<any>
  replaceData: (source: IDataSource|string, data: any, options?: IOtherOperOption) => Promise<any>
  deleteData: (source: IDataSource|string, options?: IOtherOperOption) => Promise<any>
}
