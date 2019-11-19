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
  [otherKey: string]: any
}

export interface ILoadDataOption {
  engineId?: string
  loadID?: string
}

export interface IOtherOperOption {
  engineId?: string
}

export interface IDataEngine {
  readonly id: string
  mapper: IDataMapper
  pluginManager: IPluginManager
  request: IRequest

  errorInfo?: IErrorInfo

  initializeConfig: (config?: IDataEngineConfig) => void

  loadSchema: (source: IDataSource, options?: IOtherOperOption) => Promise<IDataSchema|undefined>

  sendRequest: (source: IDataSource, method: string, options?: ISendRequestOption) => Promise<any>
  loadData: (source: IDataSource, options?: ILoadDataOption) => Promise<any>
  updateData: (source: IDataSource, data: any, options?: IOtherOperOption) => Promise<any>
  replaceData: (source: IDataSource, data: any, options?: IOtherOperOption) => Promise<any>
  deleteData: (source: IDataSource, options?: IOtherOperOption) => Promise<any>
}
