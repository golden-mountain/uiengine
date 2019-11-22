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
    source: IDataSource|string,
    schema: IDataSchema | IDataNodeSchema,
  ) => void
  getDataSchema: (
    source: IDataSource|string,
    fromRoot?: boolean,
  ) => IDataSchema | IDataNodeSchema | undefined
  clearDataSchema: (
    source?: IDataSource|string,
  ) => void
  getEntryPoint: (
    source: IDataSource|string,
    method?: string,
  ) => string | undefined
}
