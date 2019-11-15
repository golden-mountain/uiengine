import { IDataSchema, IDataNodeSchema } from '../Common'
import { IDataSource } from '../DataNode'
import { IPluginManager } from '../PluginManager'
import { IRequest, IErrorInfo } from '../Request'

export interface IDataMap {
  dataSchema: {
    [lineage: string]: IDataSchema | IDataNodeSchema
  }
}

export interface IDataMapper {
  readonly id: string
  pluginManager: IPluginManager

  dataMap: IDataMap
  errorInfo?: IErrorInfo

  setDataSchema: (
    source: IDataSource,
    schema: IDataSchema | IDataNodeSchema,
  ) => void
  getDataSchema: (
    source: IDataSource,
    fromRoot?: boolean,
  ) => IDataSchema | IDataNodeSchema | undefined
  clearDataSchema: (
    source?: IDataSource,
  ) => void
  getEntryPoint: (
    source: IDataSource,
    method?: string,
  ) => string | undefined
}
